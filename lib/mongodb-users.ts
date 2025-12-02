import { connectToDatabase, connectToV2Database } from '@/lib/database-factory';
import { ObjectId } from 'mongodb';

export interface MongoUser {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  salt: string;
  plan: string;
  plan_expires_at: string | null;
  created_at: string;
  verification_code?: string | null;
  is_verified: boolean;
  code_expires?: string | null;
  enabled: boolean;
  subscription_id?: string | null;
  subscription_status?: string | null;
  cancel_at_period_end?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  user_options?: {
    cache?: boolean;
    [key: string]: any;
  };
  claude_access?: boolean;
  rpd?: number;
  rpm?: number;
  updated_at?: string;
  scheduled_downgrade?: any;
  admin?: boolean;
  beta_enrolled?: boolean;
  beta_enrolled_at?: Date;
  beta_terms_accepted?: boolean;
}

export interface V2User {
  _id: ObjectId;
  id: string;
  created_by: string;
  name: string;
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
  user_options?: {
    cache?: boolean;
    [key: string]: any;
  };
}

// V1 Database functions (primary auth database)
export async function getUserByEmail(email: string): Promise<MongoUser | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  return user as MongoUser | null;
}

export async function getUserById(userId: string): Promise<MongoUser | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  return user as MongoUser | null;
}

export async function updateUserPlan(userId: string, plan: string, expiresAt?: string | number) {
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');
  
  const updateData: any = { 
    plan,
    updated_at: new Date().toISOString()
  };
  
  if (expiresAt) {
    // Handle both string and number timestamps
    updateData.plan_expires_at = typeof expiresAt === 'number' ? expiresAt.toString() : expiresAt;
  } else {
    updateData.plan_expires_at = null;
  }
  
  return await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

export async function updateUserSubscription(userId: string, subscriptionData: {
  subscription_id?: string | null;
  subscription_status?: string;
  plan_expires_at?: number;
  cancel_at_period_end?: boolean;
  plan?: string;
}) {
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');
  
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (subscriptionData.subscription_id !== undefined) {
    updateData.subscription_id = subscriptionData.subscription_id;
  }
  if (subscriptionData.subscription_status) {
    updateData.subscription_status = subscriptionData.subscription_status;
  }
  if (subscriptionData.plan_expires_at) {
    updateData.plan_expires_at = subscriptionData.plan_expires_at.toString();
  }
  if (subscriptionData.cancel_at_period_end !== undefined) {
    updateData.cancel_at_period_end = subscriptionData.cancel_at_period_end;
  }
  if (subscriptionData.plan) {
    updateData.plan = subscriptionData.plan;
  }
  
  return await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

// V2 Database functions (operational data)
export async function getV2UserById(userId: string): Promise<V2User | null> {
  const { db } = await connectToV2Database();
  
  // Try multiple lookup strategies
  let user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  
  if (!user) {
    user = await db.collection('users').findOne({ 
      $or: [
        { created_by: userId },
        { id: userId },
        { original_d1_username: userId }
      ]
    });
  }
  
  return user as V2User | null;
}

export async function updateV2UserPlan(userId: string, plan: string, expiresAt?: number) {
  const { db } = await connectToV2Database();
  const usersCollection = db.collection('users');
  
  const updateData: any = {
    plan,
    updated_at: Math.floor(Date.now() / 1000)
  };
  
  if (expiresAt) {
    updateData.plan_expires_at = expiresAt;
  } else {
    updateData.plan_expires_at = null;
  }
  
  return await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

export async function ensureV2UserExists(v1User: MongoUser): Promise<V2User | null> {
  const { db } = await connectToV2Database();
  
  // Check if V2 user exists
  let v2User = await db.collection('users').findOne({ _id: v1User._id });
  
  if (!v2User) {
    // Create V2 user
    const v2UserData = {
      _id: v1User._id,
      id: v1User._id.toString(),
      created_by: v1User._id.toString(),
      name: v1User.username,
      api_key: [],
      plan: v1User.plan,
      enabled: v1User.enabled,
      credits: getPlanCredits(v1User.plan),
      credits_last_reset: Math.floor(Date.now() / 1000),
      created_at: Math.floor(new Date(v1User.created_at).getTime() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
      cancel_at_period_end: v1User.cancel_at_period_end || false,
      plan_expires_at: v1User.plan_expires_at ? parseInt(v1User.plan_expires_at) : null,
      original_d1_username: v1User.username,
      user_options: v1User.user_options || { cache: true }
    };
    
    await db.collection('users').insertOne(v2UserData);
    v2User = v2UserData;
  } else {
    // Only update plan if it actually changed, don't reset credits
    const nowSec = Math.floor(Date.now() / 1000);
    let expiresSec = v1User.plan_expires_at ? parseInt(v1User.plan_expires_at) : 0;
    let effectivePlan = v1User.plan;
    if (effectivePlan !== 'free' && expiresSec > 0 && expiresSec < nowSec) {
      effectivePlan = 'free';
      expiresSec = 0;
    }

    const needsPlanUpdate = v2User.plan !== effectivePlan;
    
    if (needsPlanUpdate) {
      const updateData: any = {
        plan: effectivePlan,
        plan_expires_at: expiresSec || null,
        updated_at: nowSec
      };

      // Only reset credits if the plan actually changed
      if (needsPlanUpdate) {
        updateData.credits = getPlanCredits(effectivePlan);
        updateData.credits_last_reset = nowSec;
      }

      await db.collection('users').updateOne(
        { _id: v1User._id },
        { $set: updateData }
      );
      
      // Refresh the user data
      v2User = await db.collection('users').findOne({ _id: v1User._id });
    }
  }
  
  return v2User as V2User;
}

// Combined user profile function
export async function getFullUserProfile(userId: string) {
  // Get V1 user (primary auth data)
  const v1User = await getUserById(userId);
  if (!v1User) return null;
  
  // Ensure V2 user exists and get it
  const v2User = await ensureV2UserExists(v1User);
  if (!v2User) return null;
  
  return {
    v1User,
    v2User,
    combined: {
      id: v1User._id.toString(),
      mongoId: v1User._id.toString(),
      username: v1User.username,
      email: v1User.email,
      plan: v1User.plan, // V1 is source of truth for plan
      plan_expires_at: v1User.plan_expires_at,
      is_verified: v1User.is_verified,
      subscription_id: v1User.subscription_id || null,
      subscription_status: v1User.subscription_status || null,
      cancel_at_period_end: v1User.cancel_at_period_end || false,
      credits: v2User.credits || 0,
      credits_last_reset: v2User.credits_last_reset,
      enabled: v1User.enabled,
      user_options: v1User.user_options || { cache: true },
      claude_access: v1User.claude_access || false,
      rpd: v1User.rpd || getPlanRPD(v1User.plan),
      rpm: v1User.rpm || getPlanRPM(v1User.plan),
      admin: v1User.admin || false
    }
  };
}

export const PLAN_CREDITS = {
  'free': 125_000,
  'economy': 650_000,
  'basic': 1_000_000,
  'premium': 4_250_000,
  'contributor': 5_000_000,
  'pro': 8_500_000,
  'ultra': 12_500_000,
  'enterprise': 80_000_000,
  'admin': 1_000_000_000_000_000,
} as const;

export const PLAN_RPD = {
  'free': 50,
  'economy': 750,
  'basic': 2000,
  'premium': 5000,
  'contributor': 6000,
  'pro': 7500,
  'ultra': 10000,
  'enterprise': 40000,
  'admin': 1000000,
} as const;

export const PLAN_RPM = {
  'free': 5,
  'economy': 10,
  'basic': 10,
  'premium': 35,
  'contributor': 50,
  'pro': 75,
  'ultra': 100,
  'enterprise': 200,
  'admin': 10000,
} as const;

export function getPlanCredits(plan: string): number {
  return PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] || PLAN_CREDITS.free;
}

export function getPlanRPD(plan: string): number {
  return PLAN_RPD[plan as keyof typeof PLAN_RPD] || PLAN_RPD.free;
}

export function getPlanRPM(plan: string): number {
  return PLAN_RPM[plan as keyof typeof PLAN_RPM] || PLAN_RPM.free;
}