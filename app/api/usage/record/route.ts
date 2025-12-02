import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify the request is coming from the API system
    const authHeader = req.headers.get('authorization');
    const apiSecret = process.env.API_USAGE_SECRET || 'your-usage-secret';
    
    if (authHeader !== `Bearer ${apiSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { userId, creditsUsed, model, status } = payload || {};

    if (!userId || creditsUsed === undefined || creditsUsed === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, creditsUsed' },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    // Ensure the user exists
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deduct credits from user and update aggregates
    const currentCredits = Number(user.credits || BigInt(0));
    const newCredits = Math.max(0, currentCredits - Number(creditsUsed));
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: BigInt(newCredits),
        totalRequests: (user.totalRequests || 0) + 1,
        totalCreditsUsed: (user.totalCreditsUsed || 0) + Number(creditsUsed),
        lastRequestAt: BigInt(nowSec),
        updatedAt: BigInt(nowSec)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}