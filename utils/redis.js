import redis from 'redis'
import { promisify } from 'util'
class RedisClient {
  constructor() {
    this.redisClient = redis.createClient();
    this.connected = true;
    this.redisClient.on('error', (error) => {
      console.log(error);
    })
    this.redisClient.on('connect', () => {
      this.connected = true;
    })
    this.redisClient.on('ready', () => {
      this.connected = true;
    })
    this.redisClient.on('end', () => {
      this.connected = false;
    })
  }
  isAlive() {
    return this.connected;
  }
  async get(key) {
    const getValue = promisify(this.redisClient.get).bind(this.redisClient)
    try {
      const value = await getValue(key);
      return value;
    }
    catch(error) {
      console.log(`an error occured during get ${error}`);
      return null;
    }
  }
  async set(key, value, duration) {
    const setValue = promisify(this.redisClient.set).bind(this.redisClient);
    try {
      await setValue(key, value, 'EX', duration);
    }
    catch(error) {
      console.log(error);
    }
  }
  async del (key) {
    const delKey = promisify(this.redisClient.del).bind(this.redisClient);
    try {
      await delKey(key)
    }
    catch(error) {
      console.log(error);
    }
  }
}
const redisClient = new RedisClient();
export default redisClient