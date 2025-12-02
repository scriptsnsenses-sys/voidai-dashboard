import { Pool, PoolClient } from 'pg';

if (!process.env.POSTGRESQL_URI) {
  throw new Error('Please add your POSTGRESQL_URI to .env file');
}

const connectionString = process.env.POSTGRESQL_URI;

// Connection pool configuration
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Database connection function
export async function connectToDatabase() {
  try {
    const client = await pool.connect();
    return { 
      client: pool, 
      db: {
        collection: (name: string) => new PostgreSQLCollection(name, pool)
      }
    };
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    throw error;
  }
}

// For compatibility with V2 database calls
export async function connectToV2Database() {
  return await connectToDatabase();
}

// For compatibility with usages database calls  
export async function connectToUsagesDatabase() {
  return await connectToDatabase();
}

// PostgreSQL Collection wrapper to mimic MongoDB API
class PostgreSQLCollection {
  constructor(private tableName: string, private pool: Pool) {}

  async findOne(filter: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values } = this.buildWhereClause(filter);
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
      const { whereClause, values } = this.buildWhereClause(filter);
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
      const { whereClause, values: whereValues } = this.buildWhereClause(filter);
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
        matchedCount: result.rowCount,
        upsertedId: null,
        upsertedCount: 0
      };
    } finally {
      client.release();
    }
  }

  async deleteOne(filter: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values } = this.buildWhereClause(filter);
      const query = `DELETE FROM ${this.tableName} ${whereClause}`;
      
      const result = await client.query(query, values);
      return {
        acknowledged: true,
        deletedCount: result.rowCount
      };
    } finally {
      client.release();
    }
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const client = await this.pool.connect();
    try {
      const { whereClause, values } = this.buildWhereClause(filter);
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
      
      const result = await client.query(query, values);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    // Basic aggregation support - would need to be expanded based on specific needs
    const client = await this.pool.connect();
    try {
      // This is a simplified implementation
      // In practice, you'd translate MongoDB aggregation pipeline to SQL
      const query = `SELECT * FROM ${this.tableName}`;
      const result = await client.query(query);
      return result.rows.map(row => this.transformFromPostgreSQL(row));
    } finally {
      client.release();
    }
  }

  private buildWhereClause(filter: any): { whereClause: string; values: any[] } {
    if (!filter || Object.keys(filter).length === 0) {
      return { whereClause: '', values: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') {
        // Handle MongoDB ObjectId
        conditions.push(`id = $${paramIndex++}`);
        values.push(typeof value === 'object' && value.toString ? value.toString() : value);
      } else if (key === '$or') {
        // Handle $or operator
        const orConditions: string[] = [];
        for (const orFilter of value as any[]) {
          for (const [orKey, orValue] of Object.entries(orFilter)) {
            if (orKey === '_id') {
              orConditions.push(`id = $${paramIndex++}`);
              values.push(typeof orValue === 'object' && orValue.toString ? orValue.toString() : orValue);
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
        if (typeof value === 'string' && key === 'email') {
          conditions.push(`LOWER(${pgKey}) = LOWER($${paramIndex++})`);
          values.push(value);
        } else {
          conditions.push(`${pgKey} = $${paramIndex++}`);
          values.push(value);
        }
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  private buildUpdateClause(update: any, startIndex: number = 0): { setClause: string; values: any[] } {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = startIndex + 1;

    // Handle MongoDB $set operator
    const updateData = update.$set || update;

    for (const [key, value] of Object.entries(updateData)) {
      const pgKey = this.camelToSnake(key);
      setClauses.push(`${pgKey} = $${paramIndex++}`);
      values.push(value);
    }

    // Always update the updated_at timestamp
    setClauses.push(`updated_at = extract(epoch from now())`);

    return { setClause: setClauses.join(', '), values };
  }

  private transformToPostgreSQL(document: any): any {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(document)) {
      if (key === '_id') {
        // Convert MongoDB ObjectId to UUID string
        transformed.id = typeof value === 'object' && value.toString ? value.toString() : value;
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
        // Convert UUID back to MongoDB-style _id
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

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('PostgreSQL health check failed:', error);
    return false;
  }
}

// Close pool connections
export async function closeConnections(): Promise<void> {
  await pool.end();
}