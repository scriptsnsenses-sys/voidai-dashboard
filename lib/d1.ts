interface D1QueryResult {
  success: boolean;
  results?: any[];
  error?: string;
  meta?: {
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
    duration?: number;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1QueryResult>;
}

interface D1PreparedStatement {
  bind(...params: any[]): D1PreparedStatement;
  first(): Promise<any>;
  all(): Promise<{ results: any[]; meta: any }>;
  run(): Promise<D1QueryResult>;
}

class D1Connection {
  private apiUrl: string;
  private headers: { [key: string]: string };

  constructor() {
    if (!process.env.CLOUDFLARE_D1_API_TOKEN) {
      throw new Error('CLOUDFLARE_D1_API_TOKEN environment variable is required');
    }
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
    }
    if (!process.env.CLOUDFLARE_DATABASE_ID) {
      throw new Error('CLOUDFLARE_DATABASE_ID environment variable is required');
    }

    this.apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}`;
    this.headers = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_D1_API_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  async query(sql: string, params: any[] = []): Promise<D1QueryResult> {
    try {
      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          sql: sql,
          params: params
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('D1 API Error:', response.status, errorText);
        return {
          success: false,
          error: `D1 API Error: ${response.status} ${errorText}`
        };
      }

      const result = await response.json();
      
      if (result.success && result.result && result.result.length > 0) {
        return {
          success: true,
          results: result.result[0].results || [],
          meta: result.result[0].meta || {}
        };
      } else {
        return {
          success: true,
          results: [],
          meta: {}
        };
      }
    } catch (error) {
      console.error('Error executing D1 query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  prepare(query: string): D1PreparedStatement {
    return {
      bind: (...params: any[]) => this.prepare(query).bind(...params),
      first: async () => {
        const result = await this.query(query);
        return result.results && result.results.length > 0 ? result.results[0] : null;
      },
      all: async () => {
        const result = await this.query(query);
        return {
          results: result.results || [],
          meta: result.meta || {}
        };
      },
      run: async () => {
        return await this.query(query);
      }
    };
  }

  async exec(query: string): Promise<D1QueryResult> {
    return await this.query(query);
  }
}

let d1Instance: D1Connection | null = null;

export function getD1Database(): D1Connection {
  if (!d1Instance) {
    d1Instance = new D1Connection();
  }
  return d1Instance;
}

export async function connectToD1() {
  return getD1Database();
}

// User-related helper functions
export async function getUserById(userId: string) {
  const db = getD1Database();
  const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return result.results && result.results.length > 0 ? result.results[0] : null;
}

export async function getUserByCreatedBy(mongoUserId: string) {
  const db = getD1Database();
  const result = await db.query('SELECT * FROM users WHERE created_by = ?', [mongoUserId]);
  return result.results && result.results.length > 0 ? result.results[0] : null;
}

export async function createD1User(mongoUserId: string, plan: string = 'free') {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Import plan credits from MongoDB users helper
  const { getPlanCredits } = await import('@/lib/mongodb-users');
  const dailyCredits = getPlanCredits(plan);
  
  const result = await db.query(
    `INSERT INTO users (created_by, plan, credits, credits_last_reset, enabled, created_at, updated_at, api_key)
     VALUES (?, ?, ?, ?, 1, ?, ?, '[]')`,
    [mongoUserId, plan, dailyCredits, currentTime, currentTime, currentTime]
  );
  
  if (result.success && result.meta?.last_row_id) {
    return await getUserById(result.meta.last_row_id.toString());
  }
  
  return null;
}

export async function updateUserPlan(userId: string, plan: string, expiresAt?: string) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Check if plan_expires_at column exists, if not add it
  await ensurePlanExpiresAtColumn(db);
  
  if (expiresAt) {
    return await db.query(
      'UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE id = ?',
      [plan, expiresAt, currentTime, userId]
    );
  } else {
    return await db.query(
      'UPDATE users SET plan = ?, updated_at = ? WHERE id = ?',
      [plan, currentTime, userId]
    );
  }
}

// Helper function to ensure plan_expires_at column exists
async function ensurePlanExpiresAtColumn(db: D1Connection) {
  try {
    // Check if the column exists by querying table info
    const schemaResult = await db.query('PRAGMA table_info(users)');
    
    if (schemaResult.success && schemaResult.results) {
      const columns = schemaResult.results.map((col: any) => col.name);
      
      if (!columns.includes('plan_expires_at')) {
        console.log('Adding missing plan_expires_at column to users table...');
        const alterResult = await db.query('ALTER TABLE users ADD COLUMN plan_expires_at TEXT');
        
        if (alterResult.success) {
          console.log('Successfully added plan_expires_at column');
        } else {
          console.error('Failed to add plan_expires_at column:', alterResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error checking/adding plan_expires_at column:', error);
    // Don't throw error, just log it - the function should continue to work
  }
}

export async function updateUserCredits(userId: string, credits: number) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  return await db.query(
    'UPDATE users SET credits = ?, credits_last_reset = ?, updated_at = ? WHERE id = ?',
    [credits, currentTime, currentTime, userId]
  );
}

export async function getUserApiKeys(userId: string) {
  const db = getD1Database();
  const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (result.results && result.results.length > 0) {
    const user = result.results[0];
    if (user.api_key) {
      try {
        return JSON.parse(user.api_key);
      } catch {
        return [];
      }
    }
  }
  
  return [];
}

export async function addUserApiKey(userId: string, apiKey: string) {
  const currentKeys = await getUserApiKeys(userId);
  currentKeys.push(apiKey);
  
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  return await db.query(
    'UPDATE users SET api_key = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(currentKeys), currentTime, userId]
  );
}

export async function removeUserApiKey(userId: string, apiKey: string) {
  const currentKeys = await getUserApiKeys(userId);
  const updatedKeys = currentKeys.filter((key: string) => key !== apiKey);
  
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  return await db.query(
    'UPDATE users SET api_key = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(updatedKeys), currentTime, userId]
  );
}

export async function enableUserAccount(userId: string) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  return await db.query(
    'UPDATE users SET enabled = 1, updated_at = ? WHERE id = ?',
    [currentTime, userId]
  );
}

export async function disableUserAccount(userId: string) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  return await db.query(
    'UPDATE users SET enabled = 0, updated_at = ? WHERE id = ?',
    [currentTime, userId]
  );
}

// Usage tracking functions
export async function recordUsage(userId: string, data: {
  creditsUsed: number;
  plan: string;
}) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Record the usage
  await db.query(
    'INSERT INTO usage_records (user_id, credits_used, plan, timestamp) VALUES (?, ?, ?, ?)',
    [userId, data.creditsUsed, data.plan, currentTime]
  );
  
  // Deduct credits from user's account
  await db.query(
    'UPDATE users SET credits = credits - ? WHERE id = ?',
    [data.creditsUsed, userId]
  );
  
  return { success: true };
}

export async function checkUserCredits(userId: string, creditsRequired: number): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  
  return (user.credits || 0) >= creditsRequired;
}

export async function simulateApiUsage(userId: string, creditsUsed: number) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  if ((user.credits || 0) < creditsUsed) {
    throw new Error('Insufficient credits');
  }
  
  return await recordUsage(userId, {
    creditsUsed,
    plan: user.plan
  });
}

export async function getUserUsageHistory(userId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day', limit: number = 24) {
  const db = getD1Database();
  const currentTime = Math.floor(Date.now() / 1000);
  
  let periodSeconds: number;
  switch (period) {
    case 'hour':
      periodSeconds = 60 * 60;
      break;
    case 'week':
      periodSeconds = 7 * 24 * 60 * 60;
      break;
    case 'month':
      periodSeconds = 30 * 24 * 60 * 60;
      break;
    case 'day':
    default:
      periodSeconds = 24 * 60 * 60;
      break;
  }
  
  const startTime = currentTime - periodSeconds;
  
  const result = await db.query(
    'SELECT * FROM usage_records WHERE user_id = ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?',
    [userId, startTime, limit]
  );
  
  return result.results || [];
}

export async function getCurrentUsage(userId: string) {
  const db = getD1Database();
  const user = await getUserById(userId);
  if (!user) return null;
  
  // Import plan credits from MongoDB users helper
  const { getPlanCredits } = await import('@/lib/mongodb-users');
  const dailyLimit = getPlanCredits(user.plan);
  
  // Get current credits from user record
  const currentCredits = user.credits || 0;
  const creditsUsed = dailyLimit - currentCredits;
  
  return {
    plan: user.plan,
    usage: {
      credits: {
        current: currentCredits,
        used: creditsUsed,
        limit: dailyLimit,
        remaining: currentCredits
      }
    }
  };
}