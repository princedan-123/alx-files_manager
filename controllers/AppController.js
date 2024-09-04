import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    if (redisStatus && dbStatus) {
      return res.status(200).json({ redis: true, db: true });
    }
    return null;
  },
  async getStats(req, res) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    if (dbClient.isAlive()) {
      return res.status(200).json({ users: nbUsers, files: nbFiles });
    }
    return null;
  },
};
export default AppController;
