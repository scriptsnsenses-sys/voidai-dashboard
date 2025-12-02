import { connectToDatabase as connectToMongoV1 } from '@/lib/mongodb';
import { connectToV2Database as connectToPrismaV2 } from '@/lib/postgresql-prisma';

export type DatabaseType = 'mongodb' | 'postgresql';

// Get database type from environment variable
function getDatabaseType(): DatabaseType {
  // Force PostgreSQL for V2 at all times
  return 'postgresql';
}

// V1 Database (always MongoDB for auth/payments)
export async function connectToDatabase() {
  return await connectToMongoV1();
}

// V2 Database (switchable between MongoDB and PostgreSQL)
export async function connectToV2Database() {
  // Always use Prisma (PostgreSQL) for V2
  return await connectToPrismaV2();
}

// Utility functions
export function isUsingPostgreSQL(): boolean {
  return getDatabaseType() === 'postgresql';
}

export function isUsingMongoDB(): boolean {
  return false;
}

export function getCurrentDatabaseType(): DatabaseType {
  return 'postgresql';
}