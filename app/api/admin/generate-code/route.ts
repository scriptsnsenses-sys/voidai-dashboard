import { connectToDatabase } from '@/lib/mongodb';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  // Check if user ID is admin
  return ADMIN_USER_IDS.includes(userId);
}

function generateRedeemCode(plan: string): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  return `VOID-${plan.toUpperCase().substring(0, 3)}-${uuid}`;
}

export async function POST(req: NextRequest) {
  try {
    const { plan, durationDays } = await req.json();

    if (!plan || !durationDays) {
      return NextResponse.json({ error: 'Plan and duration are required' }, { status: 400 });
    }

    const validPlans = ['economy', 'basic', 'premium', 'pro', 'ultra', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (isNaN(durationDays) || durationDays < 1 || durationDays > 3650) {
      return NextResponse.json({ error: 'Duration must be between 1 and 3650 days' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string; mongoUserId?: string };

      // Use mongoUserId for admin checks, fallback to userId
      const userIdToCheck = decoded.mongoUserId || decoded.userId;
      if (!await isAdmin(userIdToCheck)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { db } = await connectToDatabase();

      const currentTime = Math.floor(Date.now() / 1000);  
      const expiryTime = currentTime + (durationDays * 24 * 60 * 60); 

      const code = generateRedeemCode(plan);

      const redeemCode = {
        redeem_codes: code,
        plan: plan,
        created_by: decoded.userId,
        created_at: new Date().toISOString(),
        plan_expires_at: expiryTime,
        used: false
      };

      const result = await db.collection('redeem_codes').insertOne(redeemCode);

      if (!result.acknowledged) {
        return NextResponse.json({ error: 'Failed to generate redeem code' }, { status: 500 });
      }

      const expiryDate = new Date(expiryTime * 1000).toISOString();

      return NextResponse.json({
        code: code,
        plan: plan,
        expiryDate: expiryDate
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error generating redeem code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
