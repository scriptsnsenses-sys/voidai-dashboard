import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { getFullUserProfile, getPlanCredits } from '@/lib/postgresql-users';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - Missing authentication token' },
        { status: 401 }
      );
    }

    let decoded: { userId: string; mongoUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
        mongoUserId?: string;
      };
    } catch (error) {
      console.error('Token verification error:', error);
      (await cookies()).delete('auth_token');
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userIdToUse = decoded.mongoUserId || decoded.userId;
    const prisma = getPrismaClient();

    // Ensure V2 profile exists and get authoritative plan
    const profile = await getFullUserProfile(userIdToUse);
    if (!profile) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const { combined } = profile;
    if (!combined.enabled) {
      return NextResponse.json(
        { message: 'User account is disabled' },
        { status: 403 }
      );
    }

    const plan = combined.plan;
    const dailyLimit = getPlanCredits(plan);

    // Load the V2 user from PostgreSQL
    let v2User = await prisma.user.findFirst({
      where: { id: userIdToUse }
    });

    if (!v2User) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);
    
    // creditsLastReset is stored in milliseconds in the database
    let lastResetMs = Number(v2User.creditsLastReset || BigInt(0));
    
    // If lastResetMs is 0, invalid, or in the future, treat it as needing immediate reset
    if (lastResetMs === 0 || lastResetMs > nowMs) {
      // If it's in the future (clock issue), use current time
      // Otherwise set to 24 hours ago to trigger immediate reset
      if (lastResetMs > nowMs) {
        console.log(`Warning: creditsLastReset is in the future (${lastResetMs} > ${nowMs}), using current time`);
        lastResetMs = nowMs;
      } else {
        lastResetMs = nowMs - (24 * 60 * 60 * 1000);
      }
    }
    
    const hoursSinceReset = (nowMs - lastResetMs) / (1000 * 60 * 60);

    // Reset credits daily if needed
    if (hoursSinceReset >= 24) {
      // Update last reset to now (in milliseconds)
      await prisma.user.update({
        where: { id: v2User.id },
        data: {
          creditsLastReset: BigInt(nowMs),
          credits: BigInt(dailyLimit),
          updatedAt: BigInt(nowSec)
        }
      });
      v2User = {
        ...v2User,
        creditsLastReset: BigInt(nowMs),
        credits: BigInt(dailyLimit),
        updatedAt: BigInt(nowSec)
      } as typeof v2User;
      lastResetMs = nowMs;
    }

    // Get current credits directly from the user record
    const currentCredits = Math.max(0, Number(v2User.credits || BigInt(0)));
    const creditsUsed = Math.max(0, dailyLimit - currentCredits);

    const usageData = {
      plan,
      usage: {
        credits: {
          current: currentCredits,
          used: creditsUsed,
          limit: dailyLimit,
          remaining: currentCredits
        }
      }
    };

    return NextResponse.json(usageData);
  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error fetching usage data' },
      { status: 500 }
    );
  }
}