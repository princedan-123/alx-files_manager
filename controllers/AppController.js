import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    if (redisStatus && dbStatus) {
      res.json({ redis: true, db: true }).status(200);
    }
  },
  async getStats(req, res) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    if (dbClient.isAlive()) {
      res.json({ users: nbUsers, files: nbFiles }).status(200);
    }
  },
};
export default AppController;
