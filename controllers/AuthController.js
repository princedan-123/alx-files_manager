import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AuthController = {
  async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (authHeader.includes('Basic')) {
      const encodedCredentials = authHeader.slice(6, -1);
      const binary = Buffer.from(encodedCredentials, 'base64');
      let credential = binary.toString('utf-8');
      credential = credential.split(':');
      const email = credential[0];
      const password = credential[1];
      try {
        const hashedPassword = sha1(password);
        const user = await dbClient.userCollection.findOne(
          { email, password: hashedPassword },
        );
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id, (60 * 60));
        return res.status(200).json({ token: `${token}` });
      } catch (error) {
        console.log(`an error occured during find operation ${error}`);
      }
    }
    return null;
  },
  async getDisconnect(req, res) {
    const tokenHeader = req.header('X-Token');
    const key = `auth_${tokenHeader}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return res.status(204);
  },
};
export default AuthController;
