import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log(`Connected to MongoDB: ${process.env.DB_NAME}`);

  client.on('close', () => {
    console.warn('MongoDB connection lost. Reconnecting...');
    db = null;
    setTimeout(connectDB, 3000);
  });

  return db;
}

export function getDB() {
  if (!db) throw new Error('Database connection unavailable.');
  return db;
}
