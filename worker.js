import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'node:fs/promises';
import dbClient from './utils/db.js';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  const sizes = [500, 250, 100];
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing fileId');
  }
  const docFound = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });
  if (!docFound) {
    throw new Error('File not found');
  }
  for (const size of sizes) {
    const options = { width: size };
    try {
      const thumbnailBuffer = await imageThumbnail(docFound.localPath, options);
      const newFilePath = `${docFound.localPath}_${size}`;
      fs.writeFileSync(newFilePath, thumbnailBuffer);
    } catch (error) {
      console.error(`Error generating thumbnail for size ${size}:`, error);
    }
  }
});
