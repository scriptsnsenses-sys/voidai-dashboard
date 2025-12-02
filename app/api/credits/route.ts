import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getFullUserProfile, getPlanCredits } from '@/lib/postgresql-users';
import { getPrismaClient } from '@/lib/postgresql-prisma';

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85'
      ) as {
        userId: string;
        mongoUserId?: string;
      };

      const userIdToUse = decoded.mongoUserId || decoded.userId;

      // Get authoritative plan from V1 and ensure V2 user exists
      const profile = await getFullUserProfile(userIdToUse);
      if (!profile) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      const { combined } = profile;
      const plan = combined.plan;
      const dailyLimit = getPlanCredits(plan);

      // Use PostgreSQL (Prisma) as the source of truth for credits/usage
      const prisma = getPrismaClient();

      // Load the V2 user (ensured by getFullUserProfile)
      let v2User = await prisma.user.findFirst({
        where: { id: userIdToUse }
      });

      if (!v2User) {
        return NextResponse.json(
          { message: 'User not found in V2' },
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

      // Calculate next reset time properly (in milliseconds)
      const nextResetMs = lastResetMs + (24 * 60 * 60 * 1000); // Add 24 hours to last reset
      const nextReset = new Date(nextResetMs);

      return NextResponse.json({
        currentCredits,
        dailyLimit,
        creditsUsed,
        resetTime: nextReset.toISOString(),
        plan,
        lastReset: new Date(lastResetMs).toISOString()
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching credit information:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}