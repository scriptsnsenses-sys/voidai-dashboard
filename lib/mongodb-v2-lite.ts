import { MongoClient } from 'mongodb';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxConnecting: 3,
  retryWrites: true,
  retryReads: true,
};

let v2ClientPromise: Promise<MongoClient> | null = null;

async function createV2Connection(): Promise<MongoClient> {
  const v2Uri = process.env.V2_MONGODB_URL;
  if (!v2Uri) {
    throw new Error('V2_MONGODB_URL environment variable is required');
  }

  // simple one-shot connect with basic retry
  let attempt = 0;
  while (true) {
    try {
      const client = new MongoClient(v2Uri, options);
      await client.connect();
      console.log('V2 Database (lite) connected successfully');
      return client;
    } catch (error) {
      attempt++;
      const delay = Math.min(5000, 1000 + attempt * 500);
      console.error(`V2 Database (lite) connection failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Lightweight V2 Mongo connector that does NOT require MONGODB_URL.
 * Only uses V2_MONGODB_URL to connect to the V2 Mongo database.
 */
export async function connectToV2Database() {
  if (!v2ClientPromise) {
    v2ClientPromise = createV2Connection();
  }
  const client = await v2ClientPromise;
  const db = client.db('voidai');
  return { client, db };
}