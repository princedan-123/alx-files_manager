import pkg from 'mongodb';
const { MongoClient } = pkg;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files-manager';
    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => this.client.db(database))
      .catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const users = this.client.db().collection('users');
      return await users.countDocuments();
    } catch (err) {
      return console.log(err.message);
    }
  }

  async nbFiles() {
    try {
      const files = this.client.db().collection('files');
      return await files.countDocuments();
    } catch (err) {
      return console.log(err.message);
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
