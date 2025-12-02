import { Pool } from 'pg';
import { mapMongoIdToUUID, ensureIdMappingTable } from './id-mapper';

if (!process.env.POSTGRESQL_URI) {
  throw new Error('Please add your POSTGRESQL_URI to .env file');
}

const connectionString = process.env.POSTGRESQL_URI;

// Connection pool for V2 PostgreSQL database
const v2Pool = new Pool({
  connectionString,
  ssl: false, // Disable SSL for local Docker PostgreSQL
  max: 5, // Reduce max connections
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 2000, // Shorter connection timeout
  statement_timeout: 5000, // 5 second statement timeout
  query_timeout: 5000, // 5 second query timeout
});

v2Pool.on('error', (err) => {
  console.error('PostgreSQL V2 pool error:', err);
});

// V2 Database connection (PostgreSQL)
export async function connectToV2Database() {
  try {
    // Test connection first
    const testClient = await v2Pool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    
    // Ensure ID mapping table exists
    await ensureIdMappingTable();
    
    return {
      client: v2Pool,
      db: {
        collection: (name: string) => new PostgreSQLCollection(name, v2Pool)
      }
    };
  } catch (error) {
    console.error('Failed to connect to V2 PostgreSQL database:', error);
    console.error('Connection string:', connectionString?.replace(/:[^:@]*@/, ':***@')); // Hide password
    throw new Error(`PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// PostgreSQL Collection wrapper to mimic MongoDB API for V2 data
class PostgreSQLCollection {
  constructor(private tableName: string, private pool: Pool) {}

  async findOne(filter: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values } = await this.buildWhereClause(filter);
      const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
      
      const result = await client.query(query, values);
      return result.rows.length > 0 ? this.transformFromPostgreSQL(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async find(filter: any = {}, options: any = {}): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values } = await this.buildWhereClause(filter);
      let query = `SELECT * FROM ${this.tableName} ${whereClause}`;
      
      if (options.sort) {
        const sortField = Object.keys(options.sort)[0];
        const sortDirection = options.sort[sortField] === -1 ? 'DESC' : 'ASC';
        query += ` ORDER BY ${this.camelToSnake(sortField)} ${sortDirection}`;
      }
      
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
      }
      
      if (options.skip) {
        query += ` OFFSET ${options.skip}`;
      }

      const result = await client.query(query, values);
      return result.rows.map(row => this.transformFromPostgreSQL(row));
    } finally {
      client.release();
    }
  }

  async insertOne(document: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const pgDoc = this.transformToPostgreSQL(document);
      const columns = Object.keys(pgDoc);
      const values = Object.values(pgDoc);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await client.query(query, values);
      return {
        acknowledged: true,
        insertedId: result.rows[0].id,
        ops: [this.transformFromPostgreSQL(result.rows[0])]
      };
    } finally {
      client.release();
    }
  }

  async updateOne(filter: any, update: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values: whereValues } = await this.buildWhereClause(filter);
      const { setClause, values: setValues } = this.buildUpdateClause(update, whereValues.length);

      const query = `
        UPDATE ${this.tableName} 
        SET ${setClause}
        ${whereClause}
        RETURNING *
      `;

      const allValues = [...whereValues, ...setValues];
      const result = await client.query(query, allValues);

      return {
        acknowledged: true,
        modifiedCount: result.rowCount,
        matchedCount: result.rowCount
      };
    } finally {
      client.release();
    }
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      // Basic aggregation - expand based on your dashboard needs
      let query = `SELECT * FROM ${this.tableName}`;
      
      // Handle basic $match stage
      if (pipeline[0] && pipeline[0].$match) {
        const { whereClause, values } = await this.buildWhereClause(pipeline[0].$match);
        query = `SELECT * FROM ${this.tableName} ${whereClause}`;
        const result = await client.query(query, values);
        return result.rows.map(row => this.transformFromPostgreSQL(row));
      }
      
      const result = await client.query(query);
      return result.rows.map(row => this.transformFromPostgreSQL(row));
    } finally {
      client.release();
    }
  }

  private async buildWhereClause(filter: any): Promise<{ whereClause: string; values: any[] }> {
    if (!filter || Object.keys(filter).length === 0) {
      return { whereClause: '', values: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') {
        // Convert MongoDB ObjectId to PostgreSQL UUID
        const mongoId = typeof value === 'object' && value?.toString ? value.toString() : String(value);
        
        try {
          const uuid = await mapMongoIdToUUID(mongoId, this.tableName);
          
          if (uuid) {
            conditions.push(`id = $${paramIndex++}`);
            values.push(uuid);
          } else {
            // If no mapping found, try to find by original MongoDB ID stored in a field
            // or just return no results
            conditions.push(`id = $${paramIndex++}`);
            values.push('00000000-0000-0000-0000-000000000000');
          }
        } catch (error) {
          console.warn('Failed to map MongoDB ID to UUID:', error);
          conditions.push(`id = $${paramIndex++}`);
          values.push('00000000-0000-0000-0000-000000000000');
        }
      } else if (key === '$or') {
        const orConditions: string[] = [];
        for (const orFilter of value as any[]) {
          for (const [orKey, orValue] of Object.entries(orFilter)) {
            if (orKey === '_id') {
              orConditions.push(`id = $${paramIndex++}`);
              values.push(typeof orValue === 'object' && orValue?.toString ? orValue.toString() : orValue);
            } else {
              const pgKey = this.camelToSnake(orKey);
              orConditions.push(`${pgKey} = $${paramIndex++}`);
              values.push(orValue);
            }
          }
        }
        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
      } else {
        const pgKey = this.camelToSnake(key);
        conditions.push(`${pgKey} = $${paramIndex++}`);
        values.push(value);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  private buildUpdateClause(update: any, startIndex: number = 0): { setClause: string; values: any[] } {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = startIndex + 1;

    const updateData = update.$set || update;

    for (const [key, value] of Object.entries(updateData)) {
      const pgKey = this.camelToSnake(key);
      setClauses.push(`${pgKey} = $${paramIndex++}`);
      values.push(value);
    }

    setClauses.push(`updated_at = extract(epoch from now())`);

    return { setClause: setClauses.join(', '), values };
  }

  private transformToPostgreSQL(document: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(document)) {
      if (key === '_id') {
        transformed.id = typeof value === 'object' && value?.toString ? value.toString() : value;
      } else {
        const pgKey = this.camelToSnake(key);
        transformed[pgKey] = value;
      }
    }

    return transformed;
  }

  private transformFromPostgreSQL(row: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (key === 'id') {
        transformed._id = { toString: () => value };
        transformed.id = value;
      } else {
        const camelKey = this.snakeToCamel(key);
        transformed[camelKey] = value;
      }
    }

    return transformed;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

// Health check for V2 PostgreSQL
export async function v2HealthCheck(): Promise<boolean> {
  try {
    const client = await v2Pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('PostgreSQL V2 health check failed:', error);
    return false;
  }
}

// Close V2 pool connections
export async function closeV2Connections(): Promise<void> {
  await v2Pool.end();
}