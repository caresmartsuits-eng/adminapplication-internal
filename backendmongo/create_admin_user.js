import 'dotenv/config';
import { connectMongo } from './src/db/mongo.js';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';

await connectMongo();
const existing = await User.findOne({ username: 'admin' });
if (!existing) {
  const password = await bcrypt.hash('adminpassword', 10);
  await User.create({ username: 'admin', password, role: 'admin' });
  console.log('Admin user created');
} else {
  console.log('Admin user already exists');
}
process.exit(0);
