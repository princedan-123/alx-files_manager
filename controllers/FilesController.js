/* eslint-disable consistent-return */
import { ObjectId } from 'mongodb';
import {
  access, constants, readFile, writeFile, mkdir,
} from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import mime from 'mime-types';
import { promisify } from 'util';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const accessFile = promisify(access);
const read = promisify(readFile);
const write = promisify(writeFile);
const createDirectory = promisify(mkdir);
const FilesController = {
  async postUpload(req, res) {
    /* user authentication */
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileName = req.body.name;
    const fileType = req.body.type;
    const acceptedTypes = ['folder', 'file', 'image'];
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    let fileData = null;
    if (fileType === 'file' || fileType === 'image') {
      fileData = req.body.data;
    }
    /* file validation */
    if (!fileName) {
      return res.status(400).json({ error: 'Missing name ' });
    }
    if (!fileType || (acceptedTypes.includes(fileType) === false)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!fileData && fileType !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    /* folder validation */
    if (parentId !== 0) {
      const file = await dbClient.fileCollection.findOne({ parentId });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file && fileType !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    /* file creation */
    const folder = {
      userId: user._id,
      name: fileName,
      type: fileType,
      parentId,
      isPublic,
    };
    if (fileType === 'folder') {
      const result = await dbClient.fileCollection.insertOne(folder);
      if (result) {
        return res.status(201).json(folder);
      }
    }
    /* storing file if not a folder */
    if (fileType !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      try {
        await createDirectory(folderPath, { recursive: true });
      } catch (error) {
        console.log(error);
      }
      const data = Buffer.from(fileData, 'base64').toString('utf-8');
      const filePath = path.join(folderPath, v4());
      try {
        await write(filePath, data, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      const file = {
        userId: user._id,
        name: fileName,
        type: fileType,
        isPublic,
        parentId,
        localPath: filePath,
      };
      try {
        await dbClient.fileCollection.insertOne(file);
      } catch (error) {
        console.log(error);
      }
      return res.status(201).json(file);
    }
  },
  async getShow(req, res) {
    /* This method retrieves files linked to a
    user based on the id parameter
    */
    /* authenticating user, this code should be made DRY */
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const files = await dbClient.fileCollection.findOne({ _id: new ObjectId(fileId) });
    if (files) {
      return res.status(200).json(files);
    }

    return res.status(404).json({ error: 'Not found' });
  },
  async getIndex(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parentId = parseInt(req.query.parentId || 0, 10);
    const page = req.query.page || 0;
    const skip = page * 20;
    const files = await dbClient.fileCollection.aggregate([
      { $match: { parentId } },
      { $skip: skip },
      { $limit: 20 },
    ]).toArray();
    return res.status(200).json(files);
  },
  async putPublish(req, res) {
    /* Retreive a user based on token */
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const file = await dbClient.fileCollection.findOne(
        { _id: new ObjectId(fileId) },
        { userId },
      );
      if (file) {
        file.isPublic = true;
        return res.status(200).json(file);
      }
      return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.log(error);
    }
  },
  async putUnpublish(req, res) {
    /* Retreive a user based on token */
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const file = await dbClient.fileCollection.findOne(
        { _id: new ObjectId(fileId) },
        { userId },
      );
      if (file) {
        file.isPublic = false;
        return res.status(200).json(file);
      }
      return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.log(error);
    }
  },
  async getFile(req, res) {
    /* returns the content of a file selected by id */
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const file = await dbClient.fileCollection.findOne({ _id: new ObjectId(fileId) });
      if (file) {
        if (file.isPublic === false || file.userId !== userId) {
          return res.status(404).json({ error: 'Not found' });
        }
        if (file.type === 'folder') {
          return res.status(400).json({ error: "A folder doesn't have content" });
        }
        try {
          await accessFile(file.localPath, constants.F_OK);
        } catch (error) {
          return res.status(404).json({ error: 'Not found' });
        }
        const contentType = mime.contentType(file.name);
        const fileContent = await read(file.localPath, 'utf-8');
        res.set('Content-Type', contentType);
        return res.status(200).send(fileContent);
      }
      return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.log(error);
    }
  },
};
export default FilesController;
