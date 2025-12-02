import { connectToV2Database as connectToMongoV2 } from '@/lib/mongodb-v2-lite';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { cryptoService } from '@/lib/crypto-service';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getPlanCredits } from '@/lib/postgresql-users';

export interface MongoApiKeyData {
  _id?: ObjectId;
  id?: string;
  created_by: string;
  name?: string;
  api_key: string[];
  plan: string;
  enabled: boolean;
  credits: number;
  credits_last_reset: number;
  created_at: number;
  updated_at: number;
  cancel_at_period_end: boolean;
  plan_expires_at: number | null;
  original_d1_username: string;
}

export class ApiKeyMigrator {
  private prisma = getPrismaClient();

  async migrateUserApiKeys(userId: string): Promise<{
    migrated: number;
    existing: number;
    errors: number;
  }> {
    const stats = { migrated: 0, existing: 0, errors: 0 };

    try {
      // Connect to MongoDB V2 to get the user's API keys
      const { db: mongoDb } = await connectToMongoV2();
      
      // Find the user in MongoDB V2 database
      const mongoUser = await mongoDb.collection('users').findOne({
        $or: [
          { _id: new ObjectId(userId) },
          { id: userId },
          { created_by: userId },
          { original_d1_username: userId }
        ]
      }) as MongoApiKeyData | null;

      if (!mongoUser) {
        console.log(`No MongoDB V2 user found for ID: ${userId}`);
        return stats;
      }

      console.log(`Found MongoDB user: ${mongoUser.name || mongoUser.original_d1_username} with ${mongoUser.api_key?.length || 0} API keys`);

      // Check if user exists in PostgreSQL
      let pgUser = await this.prisma.user.findFirst({
        where: { id: userId },
        include: { apiKeys: true }
      });

      // Compute effective plan state from Mongo V2 (treat expired paid plans as free)
      const nowSec = Math.floor(Date.now() / 1000);
      let expiresSec = mongoUser.plan_expires_at || 0;
      let effectivePlan = mongoUser.plan;
      if (effectivePlan !== 'free' && expiresSec > 0 && expiresSec < nowSec) {
        effectivePlan = 'free';
        expiresSec = 0;
      }

      if (!pgUser) {
        console.log(`Creating PostgreSQL user for: ${userId}`);
        // Create the user in PostgreSQL first
        pgUser = await this.prisma.user.create({
          data: {
            id: userId,
            name: mongoUser.name || mongoUser.original_d1_username,
            plan: effectivePlan,
            enabled: mongoUser.enabled,
            credits: BigInt(
              effectivePlan === 'free'
                ? getPlanCredits('free')
                : (mongoUser.credits || getPlanCredits(effectivePlan))
            ),
            creditsLastReset: BigInt(nowSec),
            createdAt: BigInt(mongoUser.created_at || nowSec),
            updatedAt: BigInt(mongoUser.updated_at || nowSec),
            ipWhitelist: [],
            maxConcurrentRequests: 10,
            planExpiresAt: BigInt(expiresSec),
            totalRequests: 0,
            totalTokensUsed: 0,
            totalCreditsUsed: 0,
            lastRequestAt: null
          },
          include: { apiKeys: true }
        });
      } else {
        // Update V2 user if plan or expiry is out of sync with effective state
        const needsPlanUpdate =
          pgUser.plan !== effectivePlan || Number(pgUser.planExpiresAt) !== expiresSec;

        if (needsPlanUpdate) {
          pgUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
              plan: effectivePlan,
              planExpiresAt: BigInt(expiresSec),
              credits: BigInt(getPlanCredits(effectivePlan)),
              updatedAt: BigInt(nowSec)
            },
            include: { apiKeys: true }
          });
        }
      }

      // Get existing API key search hashes to avoid duplicates
      const existingHashes = new Set(pgUser.apiKeys.map((key: any) => key.searchHash));

      // Migrate each API key from MongoDB to PostgreSQL
      const apiKeys = mongoUser.api_key || [];
      
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const plainApiKey = apiKeys[i];
          
          if (!plainApiKey || typeof plainApiKey !== 'string') {
            console.log(`Skipping invalid API key at index ${i}`);
            stats.errors++;
            continue;
          }

          // Create search hash using the exact same method as the server
          const searchHash = cryptoService.createHmac('search-hash', plainApiKey);
          
          // Check if this key already exists in PostgreSQL
          if (existingHashes.has(searchHash)) {
            console.log(`API key ${i + 1} already exists in PostgreSQL`);
            stats.existing++;
            continue;
          }

          // Hash the API key for storage
          const hashedApiKey = await cryptoService.hash(plainApiKey);
          const [encrypted, salt] = hashedApiKey.split(':');
          
          // Create masked version for display
          const maskedKey = `sk-voidai...${plainApiKey.substring(plainApiKey.length - 5)}`;

          // Create the API key in PostgreSQL
          await this.prisma.apiKey.create({
            data: {
              id: crypto.randomUUID(),
              name: i === 0 ? 'Default Key' : `API Key ${i + 1}`,
              encrypted: encrypted,
              salt: salt,
              algorithm: 'bcrypt',
              searchHash: searchHash,
              maskedKey: maskedKey,
              createdAt: BigInt(mongoUser.created_at || Math.floor(Date.now() / 1000)),
              lastUsedAt: null,
              isActive: true,
              userId: userId
            }
          });

          console.log(`✅ Migrated API key ${i + 1}: ${maskedKey}`);
          stats.migrated++;

        } catch (error) {
          console.error(`❌ Failed to migrate API key ${i + 1}:`, error);
          stats.errors++;
        }
      }

      // NOTE: Per current policy, we DO NOT delete MongoDB V2 documents.
      // We only copy keys into PostgreSQL and leave MongoDB data intact.
      return stats;

    } catch (error) {
      console.error('Migration error:', error);
      stats.errors++;
      return stats;
    }
  }

  async hasMongoApiKeys(userId: string): Promise<boolean> {
    try {
      const { db: mongoDb } = await connectToMongoV2();
      
      const mongoUser = await mongoDb.collection('users').findOne({
        $or: [
          { _id: new ObjectId(userId) },
          { id: userId },
          { created_by: userId },
          { original_d1_username: userId }
        ]
      }) as MongoApiKeyData | null;

      return !!(mongoUser && mongoUser.api_key && mongoUser.api_key.length > 0);
    } catch (error) {
      console.error('Error checking MongoDB API keys:', error);
      return false;
    }
  }
}

export const apiKeyMigrator = new ApiKeyMigrator();