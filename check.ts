import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkClient() {
  await mongoose.connect(uri!);
  const client = await mongoose.connection.collection('clients').findOne({ portalToken: '745af4ca-b1f1-41ad-9079-2a15e5857dd4' });
  console.log('Client found:', client);
  process.exit(0);
}

checkClient().catch(console.error);
