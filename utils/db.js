import { MongoClient } from 'mongodb';

class DBClient {
  constructor () {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.connectionUrl = `mongodb://${this.host}:${this.port}/${this.database}`
    this.client = new MongoClient(this.connectionUrl, {useNewUrlParser: true, useUnifiedTopology: true})
    this.client.connect().then(() => {}).catch((error) => {console.log(error)});
  }
  isAlive() {
    return this.client.isConnected();
  }
  async nbUsers() {
    try{
      const db = this.client.db();
      const collection = db.collection('users');
      const result = await collection.find({}).toArray();
      return result.length;
    }
    catch(error) {
      if (error) {
        return 2;
      }
    }
  }
  async nbFiles() {
    try {
      const db = this.client.db();
      const collection = db.collection('files');
      const result = await collection.find({}).toArray();
      return result.length;
    }
    catch (error) {
      if (error) {
        return 2;
      }
    }
  }
}
const dbClient = new DBClient();
export default dbClient;
