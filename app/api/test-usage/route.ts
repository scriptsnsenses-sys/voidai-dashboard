import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded: { userId: string; mongoUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { creditsUsed = 1000 } = await req.json();
    const userIdToUse = decoded.mongoUserId || decoded.userId;

    const prisma = getPrismaClient();
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    // Ensure user exists
    const user = await prisma.user.findFirst({ where: { id: userIdToUse } });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Deduct credits from user
    const currentCredits = Number(user.credits || BigInt(0));
    const newCredits = Math.max(0, currentCredits - Number(creditsUsed));
    
    // Update user credits and counters
    await prisma.user.update({
      where: { id: userIdToUse },
      data: {
        credits: BigInt(newCredits),
        totalRequests: (user.totalRequests || 0) + 1,
        totalCreditsUsed: (user.totalCreditsUsed || 0) + Number(creditsUsed),
        lastRequestAt: BigInt(nowSec),
        updatedAt: BigInt(nowSec)
      }
    });

    return NextResponse.json({
      success: true,
      message: `Simulated API usage: ${creditsUsed} credits recorded`,
      creditsUsed
    });
  } catch (error) {
    console.error('Error in test usage:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}