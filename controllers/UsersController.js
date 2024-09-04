import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

const UsersController = {
  async postNew (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email) {
     return res.status(400).json({error:'Missing email'});
    }
    if (!password) {
      return res.status(400).json({error:'Missing password'});
    }
    const userCollection = dbClient.userCollection;
    const result = await userCollection.findOne({email: email});
    if (result) {
      return res.status(400).json({error:'Already exist'});
    }
    const hashedPassword = sha1(password);
    const resultObject = await dbClient.userCollection.insertOne({
      email: email,
      password: hashedPassword
    })
    if (resultObject) {
      return res.status(201).json({id:resultObject.insertedId, email:email})
    }
  },
  async getMe(req, res) {
    const token = req.header('X-Token');
    if(!token) {
      return res.status(401).json({error:'Unauthorized'});
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({_id: new ObjectId(userId)}, {projection :{email:1, id:1}});
    if (user) {
      return res.status(200).json(user);
    }
    return res.status(401).json({error:'Unauthorized'})
  }
}
export default UsersController;