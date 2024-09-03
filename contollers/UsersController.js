import dbClient from '../utils/db.js';
import sha1 from 'sha1';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const users = dbClient.client.db().collection('users');
    const existingUser = await users.findOne({ email});
    if (existingUser) return res.status(400).send({ error: 'Already exist' });
    const hashedPassword = sha1(password);
    const result = await users.insertOne({ email, password });
    res.status(201).send({ id: result.insertedId, email: result.email });
  }
}

export default UsersController;
