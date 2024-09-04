import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.connectionUrl = `mongodb://${this.host}:${this.port}/${this.database}`;
    this.client = new MongoClient(
      this.connectionUrl, { useNewUrlParser: true, useUnifiedTopology: true },
    );
    this.client.connect().then(() => {
      this.db = this.client.db();
      this.userCollection = this.db.collection('users');
      this.fileCollection = this.db.collection('files');
    })
      .catch((error) => {
        console.log(error);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const collection = this.userCollection;
      const result = await collection.find({}).toArray();
      return result.length;
    } catch (error) {
      if (error) {
        return error;
      }
    }
    return null;
  }

  async nbFiles() {
    try {
      const collection = this.fileCollection;
      const result = await collection.find({}).toArray();
      return result.length;
    } catch (error) {
      if (error) {
        return error;
      }
    }
    return null;
  }
}
const dbClient = new DBClient();
export default dbClient;
