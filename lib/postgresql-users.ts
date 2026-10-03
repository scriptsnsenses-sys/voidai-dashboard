import { connectToDatabase, connectToV2Database } from '@/lib/database-factory';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export interface PostgreSQLUser {
  id: string;
  name: string;
  plan: string;
  enabled: boolean;
  credits: bigint;
  creditsLastReset: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  ipWhitelist: string[];
  maxConcurrentRequests: number | null;
  planExpiresAt: bigint;
  totalRequests: number;
  totalTokensUsed: number;
  totalCreditsUsed: number;
  lastRequestAt: bigint | null;
  apiKeys?: PostgreSQLApiKey[];
}

export interface PostgreSQLApiKey {
  id: string;
  name: string;
  encrypted: string;
  salt: string;
  algorithm: string;
  searchHash: string;
  maskedKey: string;
  createdAt: bigint;
  lastUsedAt: bigint | null;
  isActive: boolean;
  userId: string;
}

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
  profile_picture?: string | null;
  claude_access?: boolean;
  rpd?: number;
  rpm?: number;
  updated_at?: string;
  scheduled_downgrade?: any;
  admin?: boolean;
  beta_enrolled?: boolean;
  beta_enrolled_at?: Date;
  beta_terms_accepted?: boolean;
  rp_verified?: boolean;
  rp_verification_date?: string;
  rp_bonus_tokens_expires?: string;
  rp_discount_used?: boolean;
}

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

export async function updateUserRPVerification(userId: string, rpData: {
  rp_verified?: boolean;
  rp_verification_date?: string;
  rp_bonus_tokens_expires?: string;
  rp_discount_used?: boolean;
}) {
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (rpData.rp_verified !== undefined) {
    updateData.rp_verified = rpData.rp_verified;
  }
  if (rpData.rp_verification_date) {
    updateData.rp_verification_date = rpData.rp_verification_date;
  }
  if (rpData.rp_bonus_tokens_expires) {
    updateData.rp_bonus_tokens_expires = rpData.rp_bonus_tokens_expires;
  }
  if (rpData.rp_discount_used !== undefined) {
    updateData.rp_discount_used = rpData.rp_discount_used;
  }

  return await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

export async function getV2UserById(userId: string): Promise<PostgreSQLUser | null> {
  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: {
        id: userId
      },
      include: {
        apiKeys: true
      }
    });

    return user as PostgreSQLUser | null;
  } catch (error) {
    console.error('Error getting V2 user by ID:', error);
    return null;
  }
}

export async function updateV2UserPlan(userId: string, plan: string, expiresAt?: number) {
  try {
    const prisma = getPrismaClient();

    const updateData: any = {
      plan,
      updatedAt: BigInt(Math.floor(Date.now() / 1000))
    };

    if (expiresAt) {
      updateData.planExpiresAt = BigInt(expiresAt);
    } else {
      updateData.planExpiresAt = BigInt(0);
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating V2 user plan:', error);
    throw error;
  }
}

export async function ensureV2UserExists(v1User: MongoUser): Promise<PostgreSQLUser | null> {
  try {
    const prisma = getPrismaClient();
    const userId = v1User._id.toString();

    let v2User = await prisma.user.findFirst({
      where: { id: userId }
    });

    const nowSec = Math.floor(Date.now() / 1000);
    let expiresSec = v1User.plan_expires_at ? parseInt(v1User.plan_expires_at) : 0;
    let effectivePlan = v1User.plan;
    if (effectivePlan !== 'free' && expiresSec > 0 && expiresSec < nowSec) {
      effectivePlan = 'free';
      expiresSec = 0;
    }

    // Calculate credits including RP bonus if applicable
    const baseCredits = getPlanCredits(effectivePlan);
    const rpBonusActive = v1User.rp_verified && v1User.rp_bonus_tokens_expires &&
      parseInt(v1User.rp_bonus_tokens_expires) > nowSec;
    const totalCredits = baseCredits + (rpBonusActive ? 50000 : 0);

    if (!v2User) {
      const v2UserData = {
        id: userId,
        name: v1User.username,
        plan: effectivePlan,
        enabled: v1User.enabled,
        credits: BigInt(totalCredits),
        creditsLastReset: BigInt(nowSec),
        createdAt: BigInt(Math.floor(new Date(v1User.created_at).getTime() / 1000)),
        updatedAt: BigInt(nowSec),
        ipWhitelist: [],
        maxConcurrentRequests: 10,
        planExpiresAt: BigInt(expiresSec),
        totalRequests: 0,
        totalTokensUsed: 0,
        totalCreditsUsed: 0,
        lastRequestAt: null
      };

      v2User = await prisma.user.create({
        data: v2UserData
      });
    } else {
      // Check if plan or expiry need updating
      const needsPlanUpdate =
        v2User.plan !== effectivePlan || Number(v2User.planExpiresAt) !== expiresSec;
      
      // Only reset credits if there's an actual plan change, not just a mismatch
      const shouldResetCredits = needsPlanUpdate && v2User.plan !== effectivePlan;

      if (needsPlanUpdate) {
        const updateData: any = {
          plan: effectivePlan,
          planExpiresAt: BigInt(expiresSec),
          updatedAt: BigInt(nowSec)
        };

        // Only reset credits if the plan actually changed
        if (shouldResetCredits) {
          updateData.credits = BigInt(totalCredits);
        }

        v2User = await prisma.user.update({
          where: { id: userId },
          data: updateData
        });
      }
    }

    return v2User as PostgreSQLUser;
  } catch (error) {
    console.error('Error ensuring V2 user exists:', error);
    return null;
  }
}

export async function createV2ApiKey(userId: string, keyData: {
  name: string;
  encrypted: string;
  salt: string;
  algorithm: string;
  searchHash: string;
  maskedKey: string;
}): Promise<PostgreSQLApiKey | null> {
  try {
    const prisma = getPrismaClient();

    const apiKey = await prisma.apiKey.create({
      data: {
        id: crypto.randomUUID(),
        name: keyData.name,
        encrypted: keyData.encrypted,
        salt: keyData.salt,
        algorithm: keyData.algorithm,
        searchHash: keyData.searchHash,
        maskedKey: keyData.maskedKey,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        lastUsedAt: null,
        isActive: true,
        userId: userId
      }
    });

    return apiKey as PostgreSQLApiKey;
  } catch (error) {
    console.error('Error creating V2 API key:', error);
    return null;
  }
}

export async function getV2ApiKeyByHash(searchHash: string): Promise<PostgreSQLApiKey | null> {
  try {
    const prisma = getPrismaClient();

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        searchHash: searchHash,
        isActive: true
      },
      include: {
        user: true
      }
    });

    return apiKey as PostgreSQLApiKey | null;
  } catch (error) {
    console.error('Error getting V2 API key by hash:', error);
    return null;
  }
}

export async function updateV2ApiKeyLastUsed(apiKeyId: string): Promise<void> {
  try {
    const prisma = getPrismaClient();

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastUsedAt: BigInt(Math.floor(Date.now() / 1000))
      }
    });
  } catch (error) {
    console.error('Error updating V2 API key last used:', error);
  }
}

export async function getFullUserProfile(userId: string) {

  const v1User = await getUserById(userId);
  if (!v1User) return null;

  const v2User = await ensureV2UserExists(v1User);
  if (!v2User) return null;

  // Generate proxy URL for profile picture with cache-busting timestamp
  const profilePictureUrl = v1User.profile_picture
    ? `/api/profile-picture/${v1User._id.toString()}?t=${Date.now()}`
    : null;

  return {
    v1User,
    v2User,
    combined: {
      id: v1User._id.toString(),
      mongoId: v1User._id.toString(),
      username: v1User.username,
      email: v1User.email,
      plan: v1User.plan,
      plan_expires_at: v1User.plan_expires_at,
      is_verified: v1User.is_verified,
      subscription_id: v1User.subscription_id || null,
      subscription_status: v1User.subscription_status || null,
      cancel_at_period_end: v1User.cancel_at_period_end || false,
      credits: Number(v2User.credits) || 0,
      creditsLastReset: Number(v2User.creditsLastReset),
      enabled: v1User.enabled,
      user_options: v1User.user_options || { cache: true },
      profile_picture: profilePictureUrl,
      claude_access: v1User.claude_access || false,
      rpd: v1User.rpd || getPlanRPD(v1User.plan),
      rpm: v1User.rpm || getPlanRPM(v1User.plan),
      admin: v1User.admin || false,
      rp_verified: v1User.rp_verified || false,
      rp_verification_date: v1User.rp_verification_date || null,
      rp_bonus_tokens_expires: v1User.rp_bonus_tokens_expires || null,
      rp_discount_used: v1User.rp_discount_used || false
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
  return Number.MAX_SAFE_INTEGER;
}

export function getPlanRPD(plan: string): number {
  return Number.MAX_SAFE_INTEGER;
}

export function getPlanRPM(plan: string): number {
  return Number.MAX_SAFE_INTEGER;
}

export async function authenticateAndEnsureV2User(email: string): Promise<{
  v1User: MongoUser | null;
  v2User: PostgreSQLUser | null;
  combined: any;
} | null> {
  try {

    const v1User = await getUserByEmail(email);
    if (!v1User) {
      return null;
    }

    const v2User = await ensureV2UserExists(v1User);
    if (!v2User) {
      console.error('Failed to create or get V2 user');
      return null;
    }

    // Generate proxy URL for profile picture with cache-busting timestamp
    const profilePictureUrl = v1User.profile_picture
      ? `/api/profile-picture/${v1User._id.toString()}?t=${Date.now()}`
      : null;

    return {
      v1User,
      v2User,
      combined: {
        id: v1User._id.toString(),
        mongoId: v1User._id.toString(),
        username: v1User.username,
        email: v1User.email,
        plan: v1User.plan,
        plan_expires_at: v1User.plan_expires_at,
        is_verified: v1User.is_verified,
        subscription_id: v1User.subscription_id || null,
        subscription_status: v1User.subscription_status || null,
        cancel_at_period_end: v1User.cancel_at_period_end || false,
        credits: Number(v2User.credits) || 0,
        creditsLastReset: Number(v2User.creditsLastReset),
        enabled: v1User.enabled,
        user_options: v1User.user_options || { cache: true },
        profile_picture: profilePictureUrl,
        claude_access: v1User.claude_access || false,
        rpd: v1User.rpd || getPlanRPD(v1User.plan),
        rpm: v1User.rpm || getPlanRPM(v1User.plan),
        admin: v1User.admin || false,
        rp_verified: v1User.rp_verified || false,
        rp_verification_date: v1User.rp_verification_date || null,
        rp_bonus_tokens_expires: v1User.rp_bonus_tokens_expires || null,
        rp_discount_used: v1User.rp_discount_used || false
      }
    };
  } catch (error) {
    console.error('Error in authenticateAndEnsureV2User:', error);
    return null;
  }
}