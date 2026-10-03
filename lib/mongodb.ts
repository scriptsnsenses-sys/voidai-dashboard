import { MongoClient } from 'mongodb';
import { connectToV2Database as connectToPrismaV2 } from '@/lib/postgresql-prisma';

const DISABLE_MONGO = ['true', '1', 'yes'].includes((process.env.DISABLE_MONGO || '').toLowerCase());
const uri = process.env.MONGODB_URL;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxConnecting: 3,
  retryWrites: true,
  retryReads: true,
};

async function createV1Connection(connectionUri: string): Promise<MongoClient> {
  const client = new MongoClient(connectionUri, options);
  await client.connect();
  console.log('V1 Database connected successfully');
  client.on('close', () => console.log('V1 Database connection closed'));
  client.on('error', (error) => console.error('V1 Database connection error:', error));
  return client;
}

let clientPromise: Promise<MongoClient> | null = null;

export default clientPromise;

export async function connectToDatabase() {
  try {
    if (DISABLE_MONGO) {
      throw new Error('MongoDB disabled via DISABLE_MONGO');
    }
    if (!uri) {
      throw new Error('MongoDB V1 disabled: MONGODB_URL not set');
    }
    if (!clientPromise) {
      if (process.env.NODE_ENV === 'development') {
        let globalWithMongo = global as typeof globalThis & {
          _mongoClientPromise?: Promise<MongoClient>;
        };
        clientPromise = globalWithMongo._mongoClientPromise ?? createV1Connection(uri).catch((error) => {
          globalWithMongo._mongoClientPromise = undefined;
          clientPromise = null;
          throw error;
        });
        globalWithMongo._mongoClientPromise = clientPromise;
      } else {
        clientPromise = createV1Connection(uri).catch((error) => {
          clientPromise = null;
          throw error;
        });
      }
    }
    const client = await clientPromise;
    const db = client.db('voidai');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to V1 database:', error);
    throw error;
  }
}

async function createV2Connection(): Promise<MongoClient> {
  const v2Uri = process.env.V2_MONGODB_URL;
  if (!v2Uri) {
    throw new Error('V2_MONGODB_URL environment variable is required');
  }
  
  const client = new MongoClient(v2Uri, options);
  await client.connect();
  console.log('V2 Database connected successfully');
  client.on('close', () => console.log('V2 Database connection closed'));
  client.on('error', (error) => console.error('V2 Database connection error:', error));
  return client;
}

// V2 database connection for PostgreSQL (Prisma wrapper)
export async function connectToV2Database() {
  try {
    return await connectToPrismaV2();
  } catch (error) {
    console.error('Failed to connect to V2 (Prisma) database:', error);
    throw error;
  }
}

// V2 MongoDB connection (for redeem codes - ONLY MongoDB)
let v2MongoClientPromise: Promise<MongoClient> | null = null;

export async function connectToV2MongoDB() {
  try {
    const v2Uri = process.env.V2_MONGODB_URL;
    if (!v2Uri) {
      throw new Error('V2_MONGODB_URL environment variable is required for redeem codes');
    }
    if (!v2MongoClientPromise) {
      if (process.env.NODE_ENV === 'development') {
        let globalWithV2Mongo = global as typeof globalThis & {
          _v2MongoClientPromise?: Promise<MongoClient>;
        };
        v2MongoClientPromise = globalWithV2Mongo._v2MongoClientPromise ?? createV2Connection().catch((error) => {
          globalWithV2Mongo._v2MongoClientPromise = undefined;
          v2MongoClientPromise = null;
          throw error;
        });
        globalWithV2Mongo._v2MongoClientPromise = v2MongoClientPromise;
      } else {
        v2MongoClientPromise = createV2Connection().catch((error) => {
          v2MongoClientPromise = null;
          throw error;
        });
      }
    }
    const client = await v2MongoClientPromise;
    const db = client.db('voidai');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to V2 MongoDB database:', error);
    throw error;
  }
}

const usagesUri = process.env.USAGES_MONGODB_CONNECTION_STRING;

async function createUsagesConnection(): Promise<MongoClient> {
  if (!usagesUri) {
    throw new Error('USAGES_MONGODB_CONNECTION_STRING is required for usage data tracking');
  }
  
  const client = new MongoClient(usagesUri, options);
  await client.connect();
  console.log('Usages Database connected successfully');
  client.on('close', () => console.log('Usages Database connection closed'));
  client.on('error', (error) => console.error('Usages Database connection error:', error));
  return client;
}

let usagesClientPromise: Promise<MongoClient> | null = null;

export async function connectToUsagesDatabase() {
  try {
    if (DISABLE_MONGO) {
      throw new Error('MongoDB disabled via DISABLE_MONGO');
    }
    if (!usagesUri) {
      throw new Error('USAGES_MONGODB_CONNECTION_STRING is required for usage data tracking');
    }
    if (!usagesClientPromise) {
      if (process.env.NODE_ENV === 'development') {
        let globalWithUsagesMongo = global as typeof globalThis & {
          _usagesMongoClientPromise?: Promise<MongoClient>;
        };
        usagesClientPromise = globalWithUsagesMongo._usagesMongoClientPromise ?? createUsagesConnection().catch((error) => {
          globalWithUsagesMongo._usagesMongoClientPromise = undefined;
          usagesClientPromise = null;
          throw error;
        });
        globalWithUsagesMongo._usagesMongoClientPromise = usagesClientPromise;
      } else {
        usagesClientPromise = createUsagesConnection().catch((error) => {
          usagesClientPromise = null;
          throw error;
        });
      }
    }
    const client = await usagesClientPromise;
    const db = client.db('voidai');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to usages database:', error);
    throw error;
  }
}