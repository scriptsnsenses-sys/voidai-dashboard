import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Global Prisma client instance
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Initialize Prisma client with connection pooling
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRESQL_URI
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

// Get or create Prisma client instance
export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!prisma) {
      prisma = createPrismaClient();
    }
    return prisma;
  } else {
    // In development, use global variable to prevent multiple instances
    if (!global.__prisma) {
      global.__prisma = createPrismaClient();
    }
    return global.__prisma;
  }
}

// PostgreSQL V2 Database connection using Prisma
export async function connectToV2Database() {
  try {
    const prisma = getPrismaClient();
    
    // Test connection
    await prisma.$connect();
    
    return {
      client: prisma,
      db: {
        collection: (name: string) => new PrismaCollection(name, prisma)
      }
    };
  } catch (error) {
    console.error('Failed to connect to V2 PostgreSQL database with Prisma:', error);
    throw new Error(`PostgreSQL Prisma connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Prisma Collection wrapper to mimic MongoDB API
class PrismaCollection {
  constructor(private tableName: string, private prisma: PrismaClient) {}

  async findOne(filter: any): Promise<any> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        const user = await this.prisma.user.findFirst({
          where: whereClause,
          include: {
            apiKeys: true
          }
        });
        return user ? this.transformUserFromPrisma(user) : null;
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        const apiKey = await this.prisma.apiKey.findFirst({
          where: whereClause,
          include: {
            user: true
          }
        });
        return apiKey ? this.transformApiKeyFromPrisma(apiKey) : null;
      }
      return null;
    } catch (error) {
      console.error(`Error in findOne for ${this.tableName}:`, error);
      throw error;
    }
  }

  async countDocuments(filter: any = {}): Promise<number> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        return await this.prisma.user.count({
          where: whereClause
        });
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        return await this.prisma.apiKey.count({
          where: whereClause
        });
      } else if (this.tableName === 'api_requests') {
        const whereClause = this.buildApiRequestWhereClause(filter);
        return await this.prisma.apiRequest.count({
          where: whereClause
        });
      }
      // Return 0 for unsupported tables instead of throwing, to avoid breaking stats
      return 0;
    } catch (error) {
      console.error(`Error in countDocuments for ${this.tableName}:`, error);
      throw error;
    }
  }

  async find(filter: any = {}, options: any = {}): Promise<any[]> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        const users = await this.prisma.user.findMany({
          where: whereClause,
          include: {
            apiKeys: true
          },
          orderBy: options.sort ? this.buildOrderBy(options.sort) : undefined,
          take: options.limit,
          skip: options.skip
        });
        return users.map((user: any) => this.transformUserFromPrisma(user));
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        const apiKeys = await this.prisma.apiKey.findMany({
          where: whereClause,
          include: {
            user: true
          },
          orderBy: options.sort ? this.buildOrderBy(options.sort) : undefined,
          take: options.limit,
          skip: options.skip
        });
        return apiKeys.map((key: any) => this.transformApiKeyFromPrisma(key));
      } else if (this.tableName === 'api_requests') {
        const whereClause = this.buildApiRequestWhereClause(filter);
        const requests = await this.prisma.apiRequest.findMany({
          where: whereClause,
          include: {
            user: true
          },
          orderBy: options.sort ? this.buildOrderBy(options.sort) : undefined,
          take: options.limit,
          skip: options.skip
        });
        return requests.map((req: any) => this.transformApiRequestFromPrisma(req));
      }
      return [];
    } catch (error) {
      console.error(`Error in find for ${this.tableName}:`, error);
      throw error;
    }
  }

  async insertOne(document: any): Promise<any> {
    try {
      if (this.tableName === 'users') {
        const userData = this.transformUserToPrisma(document);
        const user = await this.prisma.user.create({
          data: userData,
          include: {
            apiKeys: true
          }
        });
        return {
          acknowledged: true,
          insertedId: user.id,
          ops: [this.transformUserFromPrisma(user)]
        };
      } else if (this.tableName === 'api_keys') {
        const apiKeyData = this.transformApiKeyToPrisma(document);
        const apiKey = await this.prisma.apiKey.create({
          data: apiKeyData,
          include: {
            user: true
          }
        });
        return {
          acknowledged: true,
          insertedId: apiKey.id,
          ops: [this.transformApiKeyFromPrisma(apiKey)]
        };
      }
      throw new Error(`Unsupported table: ${this.tableName}`);
    } catch (error) {
      console.error(`Error in insertOne for ${this.tableName}:`, error);
      throw error;
    }
  }

  async updateOne(filter: any, update: any): Promise<any> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        const updateData = this.transformUserUpdateToPrisma(update);
        const result = await this.prisma.user.updateMany({
          where: whereClause,
          data: updateData
        });
        return {
          acknowledged: true,
          modifiedCount: result.count,
          matchedCount: result.count
        };
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        const updateData = this.transformApiKeyUpdateToPrisma(update);
        const result = await this.prisma.apiKey.updateMany({
          where: whereClause,
          data: updateData
        });
        return {
          acknowledged: true,
          modifiedCount: result.count,
          matchedCount: result.count
        };
      }
      throw new Error(`Unsupported table: ${this.tableName}`);
    } catch (error) {
      console.error(`Error in updateOne for ${this.tableName}:`, error);
      throw error;
    }
  }

  async deleteOne(filter: any): Promise<any> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        // Prisma doesn't support deleteOne with where clause that isn't unique directly,
        // but for MongoDB compatibility usually _id is used which is unique.
        // If not unique, we delete first match.
        const user = await this.prisma.user.findFirst({ where: whereClause });
        if (user) {
            await this.prisma.user.delete({ where: { id: user.id } });
            return { acknowledged: true, deletedCount: 1 };
        }
        return { acknowledged: true, deletedCount: 0 };
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        const key = await this.prisma.apiKey.findFirst({ where: whereClause });
        if (key) {
            await this.prisma.apiKey.delete({ where: { id: key.id } });
            return { acknowledged: true, deletedCount: 1 };
        }
        return { acknowledged: true, deletedCount: 0 };
      }
      throw new Error(`Unsupported table for deleteOne: ${this.tableName}`);
    } catch (error) {
      console.error(`Error in deleteOne for ${this.tableName}:`, error);
      throw error;
    }
  }

  async deleteMany(filter: any): Promise<any> {
    try {
      if (this.tableName === 'users') {
        const whereClause = this.buildUserWhereClause(filter);
        const result = await this.prisma.user.deleteMany({ where: whereClause });
        return { acknowledged: true, deletedCount: result.count };
      } else if (this.tableName === 'api_keys') {
        const whereClause = this.buildApiKeyWhereClause(filter);
        const result = await this.prisma.apiKey.deleteMany({ where: whereClause });
        return { acknowledged: true, deletedCount: result.count };
      } else if (this.tableName === 'keys') {
         // Handle legacy 'keys' collection mapping to 'api_keys' if needed,
         // or generic handling if 'keys' is distinct.
         // Assuming mapping to api_keys for now based on user context usually implying api keys.
         // BUT schema has ApiKey model mapped to 'api_keys'.
         // The ban route calls: await v2Db.collection('keys').deleteMany({ created_by: userIdToBan });
         // So we need to handle 'keys' and map 'created_by' to 'userId'
         const whereClause: any = {};
         if (filter.created_by) whereClause.userId = filter.created_by;
         // Copy other filters?
         const result = await this.prisma.apiKey.deleteMany({ where: whereClause });
         return { acknowledged: true, deletedCount: result.count };
      }
      // Return 0 for unsupported tables to avoid crashing if legacy cleanup scripts run
      return { acknowledged: true, deletedCount: 0 };
    } catch (error) {
      console.error(`Error in deleteMany for ${this.tableName}:`, error);
      throw error;
    }
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    try {
      // Basic aggregation support - expand based on needs
      if (this.tableName === 'users') {
        const users = await this.prisma.user.findMany({
          include: {
            apiKeys: true
          }
        });
        return users.map((user: any) => this.transformUserFromPrisma(user));
      }
      return [];
    } catch (error) {
      console.error(`Error in aggregate for ${this.tableName}:`, error);
      throw error;
    }
  }

  private buildUserWhereClause(filter: any): any {
    const where: any = {};
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') {
        where.id = typeof value === 'object' && value?.toString ? value.toString() : String(value);
      } else if (key === 'id') {
        where.id = String(value);
      } else if (key === 'name') {
        where.name = String(value);
      } else if (key === 'plan') {
        where.plan = String(value);
      } else if (key === 'enabled') {
        where.enabled = Boolean(value);
      }
    }
    
    return where;
  }

  private buildApiKeyWhereClause(filter: any): any {
    const where: any = {};
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') {
        where.id = typeof value === 'object' && value?.toString ? value.toString() : String(value);
      } else if (key === 'id') {
        where.id = String(value);
      } else if (key === 'searchHash') {
        where.searchHash = String(value);
      } else if (key === 'userId') {
        where.userId = String(value);
      } else if (key === 'isActive') {
        where.isActive = Boolean(value);
      }
    }
    
    return where;
  }

  private buildApiRequestWhereClause(filter: any): any {
    const where: any = {};
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'createdAt') {
        if (value && typeof value === 'object') {
          const dateFilter = value as any;
          // Database stores timestamps in milliseconds (BigInt)
          if (dateFilter.$gte) where.createdAt = { ...where.createdAt, gte: BigInt(new Date(dateFilter.$gte).getTime()) };
          if (dateFilter.$gt) where.createdAt = { ...where.createdAt, gt: BigInt(new Date(dateFilter.$gt).getTime()) };
          if (dateFilter.$lte) where.createdAt = { ...where.createdAt, lte: BigInt(new Date(dateFilter.$lte).getTime()) };
          if (dateFilter.$lt) where.createdAt = { ...where.createdAt, lt: BigInt(new Date(dateFilter.$lt).getTime()) };
        } else {
           where.createdAt = BigInt(new Date(value as string).getTime());
        }
      } else if (key === 'userId') {
        where.userId = String(value);
      }
    }
    
    return where;
  }

  private buildOrderBy(sort: any): any {
    const orderBy: any = {};
    for (const [key, direction] of Object.entries(sort)) {
      orderBy[key] = direction === -1 ? 'desc' : 'asc';
    }
    return orderBy;
  }

  private transformUserToPrisma(document: any): any {
    return {
      id: document.id || document._id?.toString() || crypto.randomUUID(),
      name: document.name,
      plan: document.plan,
      enabled: document.enabled,
      credits: BigInt(document.credits || 0),
      creditsLastReset: BigInt(document.creditsLastReset || Math.floor(Date.now() / 1000)),
      createdAt: BigInt(document.createdAt || Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(document.updatedAt || Math.floor(Date.now() / 1000)),
      ipWhitelist: document.ipWhitelist || [],
      maxConcurrentRequests: document.maxConcurrentRequests || 10,
      planExpiresAt: BigInt(document.planExpiresAt || 0),
      totalRequests: document.totalRequests || 0,
      totalTokensUsed: document.totalTokensUsed || 0,
      totalCreditsUsed: document.totalCreditsUsed || 0,
      lastRequestAt: document.lastRequestAt ? BigInt(document.lastRequestAt) : null
    };
  }

  private transformApiKeyToPrisma(document: any): any {
    return {
      id: document.id || crypto.randomUUID(),
      name: document.name,
      encrypted: document.encrypted,
      salt: document.salt,
      algorithm: document.algorithm,
      searchHash: document.searchHash,
      createdAt: BigInt(document.createdAt || Math.floor(Date.now() / 1000)),
      lastUsedAt: document.lastUsedAt ? BigInt(document.lastUsedAt) : null,
      isActive: document.isActive,
      userId: document.userId
    };
  }

  private transformUserFromPrisma(user: any): any {
    return {
      _id: { toString: () => user.id },
      id: user.id,
      name: user.name,
      plan: user.plan,
      enabled: user.enabled,
      credits: Number(user.credits),
      creditsLastReset: Number(user.creditsLastReset),
      createdAt: Number(user.createdAt),
      updatedAt: Number(user.updatedAt),
      ipWhitelist: user.ipWhitelist,
      maxConcurrentRequests: user.maxConcurrentRequests,
      planExpiresAt: Number(user.planExpiresAt),
      totalRequests: user.totalRequests,
      totalTokensUsed: user.totalTokensUsed,
      totalCreditsUsed: user.totalCreditsUsed,
      lastRequestAt: user.lastRequestAt ? Number(user.lastRequestAt) : null,
      api_key: user.apiKeys?.map((key: any) => key.searchHash) || []
    };
  }

  private transformApiKeyFromPrisma(apiKey: any): any {
    return {
      _id: { toString: () => apiKey.id },
      id: apiKey.id,
      name: apiKey.name,
      encrypted: apiKey.encrypted,
      salt: apiKey.salt,
      algorithm: apiKey.algorithm,
      searchHash: apiKey.searchHash,
      createdAt: Number(apiKey.createdAt),
      lastUsedAt: apiKey.lastUsedAt ? Number(apiKey.lastUsedAt) : null,
      isActive: apiKey.isActive,
      userId: apiKey.userId
    };
  }

  private transformApiRequestFromPrisma(req: any): any {
    return {
      _id: { toString: () => req.id },
      id: req.id,
      userId: req.userId,
      endpoint: req.endpoint,
      model: req.model,
      tokensUsed: Number(req.tokensUsed),
      creditsUsed: Number(req.creditsUsed),
      status: req.status,
      statusCode: req.statusCode,
      latency: req.latency,
      createdAt: Number(req.createdAt), // Already in ms
      user: req.user ? this.transformUserFromPrisma(req.user) : null
    };
  }

  private transformUserUpdateToPrisma(update: any): any {
    const updateData = update.$set || update;
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'credits') {
        transformed.credits = BigInt(value as number);
      } else if (key === 'creditsLastReset') {
        transformed.creditsLastReset = BigInt(value as number);
      } else if (key === 'updatedAt') {
        transformed.updatedAt = BigInt(value as number);
      } else if (key === 'planExpiresAt') {
        transformed.planExpiresAt = BigInt(value as number);
      } else if (key === 'lastRequestAt') {
        transformed.lastRequestAt = value ? BigInt(value as number) : null;
      } else {
        transformed[key] = value;
      }
    }
    
    // Always update the timestamp
    transformed.updatedAt = BigInt(Math.floor(Date.now() / 1000));
    
    return transformed;
  }

  private transformApiKeyUpdateToPrisma(update: any): any {
    const updateData = update.$set || update;
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'lastUsedAt') {
        transformed.lastUsedAt = value ? BigInt(value as number) : null;
      } else {
        transformed[key] = value;
      }
    }
    
    return transformed;
  }
}

// Health check for Prisma PostgreSQL
export async function prismaHealthCheck(): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Prisma PostgreSQL health check failed:', error);
    return false;
  }
}

// Close Prisma connections
export async function closePrismaConnections(): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.$disconnect();
}