import { Pool } from 'pg';

// ID mapping cache
const idMappingCache = new Map<string, string>();

// PostgreSQL connection for ID mapping
let mappingPool: Pool | null = null;

function getMappingPool(): Pool {
  if (!mappingPool) {
    mappingPool = new Pool({
      connectionString: process.env.POSTGRESQL_URI,
      ssl: false,
      max: 5,
    });
  }
  return mappingPool;
}

// Create ID mapping table if it doesn't exist
export async function ensureIdMappingTable(): Promise<void> {
  const pool = getMappingPool();
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS id_mappings (
        mongo_id VARCHAR(24) PRIMARY KEY,
        postgres_uuid UUID NOT NULL,
        table_name VARCHAR(50) NOT NULL,
        created_at BIGINT DEFAULT extract(epoch from now())
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_id_mappings_postgres_uuid ON id_mappings(postgres_uuid)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_id_mappings_table ON id_mappings(table_name)
    `);
  } finally {
    client.release();
  }
}

// Map MongoDB ObjectId to PostgreSQL UUID
export async function mapMongoIdToUUID(mongoId: string, tableName: string): Promise<string | null> {
  // Check cache first
  const cacheKey = `${tableName}:${mongoId}`;
  if (idMappingCache.has(cacheKey)) {
    return idMappingCache.get(cacheKey)!;
  }

  const pool = getMappingPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT postgres_uuid FROM id_mappings WHERE mongo_id = $1 AND table_name = $2',
      [mongoId, tableName]
    );
    
    if (result.rows.length > 0) {
      const uuid = result.rows[0].postgres_uuid;
      idMappingCache.set(cacheKey, uuid);
      return uuid;
    }
    
    return null;
  } finally {
    client.release();
  }
}

// Map PostgreSQL UUID back to MongoDB ObjectId
export async function mapUUIDToMongoId(uuid: string, tableName: string): Promise<string | null> {
  const pool = getMappingPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT mongo_id FROM id_mappings WHERE postgres_uuid = $1 AND table_name = $2',
      [uuid, tableName]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].mongo_id;
    }
    
    return null;
  } finally {
    client.release();
  }
}

// Store ID mapping during migration
export async function storeIdMapping(mongoId: string, postgresUuid: string, tableName: string): Promise<void> {
  const pool = getMappingPool();
  const client = await pool.connect();
  
  try {
    await client.query(
      'INSERT INTO id_mappings (mongo_id, postgres_uuid, table_name) VALUES ($1, $2, $3) ON CONFLICT (mongo_id) DO NOTHING',
      [mongoId, postgresUuid, tableName]
    );
    
    // Update cache
    const cacheKey = `${tableName}:${mongoId}`;
    idMappingCache.set(cacheKey, postgresUuid);
  } finally {
    client.release();
  }
}

// Get all mappings for a table
export async function getAllMappingsForTable(tableName: string): Promise<Map<string, string>> {
  const pool = getMappingPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT mongo_id, postgres_uuid FROM id_mappings WHERE table_name = $1',
      [tableName]
    );
    
    const mappings = new Map<string, string>();
    for (const row of result.rows) {
      mappings.set(row.mongo_id, row.postgres_uuid);
      
      // Update cache
      const cacheKey = `${tableName}:${row.mongo_id}`;
      idMappingCache.set(cacheKey, row.postgres_uuid);
    }
    
    return mappings;
  } finally {
    client.release();
  }
}

// Close mapping pool
export async function closeMappingPool(): Promise<void> {
  if (mappingPool) {
    await mappingPool.end();
    mappingPool = null;
  }
}