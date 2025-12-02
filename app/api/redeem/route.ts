import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { getPlanCredits } from '@/lib/postgresql-users';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getIpAddress, verifyHCaptchaToken } from '@/lib/hcaptcha';

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
}

export async function POST(req: NextRequest) {
  try {
    const { code, hcaptchaToken } = await req.json();
    if (!hcaptchaToken) {
      return NextResponse.json({ message: 'CAPTCHA token is required' }, { status: 400 });
    }
    const ip = getIpAddress(req);
    const isValid = await verifyHCaptchaToken(hcaptchaToken, ip);
    if (!isValid) {
      return NextResponse.json({ message: 'CAPTCHA validation failed' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json(
        { message: 'Redeem code is required' },
        { status: 400 }
      );
    }

    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };

      // Connect to V1 MongoDB for user data and redeem codes
      const { db: v1MongoDb } = await connectToDatabase();

      // Look up redeem code in V1 MongoDB
      const redeemData = await v1MongoDb.collection('redeem_codes').findOne({
        redeem_codes: code
      });

      if (!redeemData) {
        return NextResponse.json(
          { message: 'Invalid redeem code' },
          { status: 400 }
        );
      }

      // Check if code has already been used
      if (redeemData.used) {
        return NextResponse.json(
          { message: 'This code has already been redeemed' },
          { status: 400 }
        );
      }

      // Get user from V1 MongoDB (authoritative source)
      const mongoUser = await v1MongoDb.collection('users').findOne({
        _id: new ObjectId(decoded.mongoUserId)
      });

      if (!mongoUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Update user plan in ALL databases
      const currentTime = Math.floor(Date.now() / 1000);

      // 1. Update V1 MongoDB user (authoritative source - this is what dashboard reads!)
      const v1UpdateResult = await v1MongoDb.collection('users').updateOne(
        { _id: new ObjectId(decoded.mongoUserId) },
        { $set: { 
          plan: redeemData.plan,
          plan_expires_at: redeemData.plan_expires_at ? String(redeemData.plan_expires_at) : null,
          updated_at: new Date().toISOString()
        } }
      );


      // 2. Update PostgreSQL user (set plan AND reset credits to new plan limit)
      let postgresUpdateResult = { count: 0 };
      try {
        const prisma = getPrismaClient();
        const newCredits = getPlanCredits(redeemData.plan);
        const nowMs = Date.now();
        
        const result = await prisma.user.updateMany({
          where: { id: decoded.mongoUserId },
          data: {
            plan: redeemData.plan,
            credits: BigInt(newCredits),
            creditsLastReset: BigInt(nowMs),
            updatedAt: BigInt(currentTime),
            planExpiresAt: redeemData.plan_expires_at ? BigInt(parseInt(redeemData.plan_expires_at)) : BigInt(0)
          }
        });
        postgresUpdateResult = result;
        console.log(`Reset credits to ${newCredits} for plan ${redeemData.plan}`);
      } catch (pgError) {
        console.error('PostgreSQL user update error (continuing):', pgError);
      }

      if (v1UpdateResult.matchedCount === 0) {
        return NextResponse.json(
          { message: 'Failed to update user plan' },
          { status: 500 }
        );
      }

      console.log(`Updated user ${decoded.userId} plan to ${redeemData.plan} (V1 MongoDB: ${v1UpdateResult.matchedCount}, PostgreSQL: ${postgresUpdateResult.count})`);

      // Mark the redeem code as used in V1 MongoDB (instead of deleting)
      await v1MongoDb.collection('redeem_codes').updateOne(
        { redeem_codes: code },
        { $set: { used: true, used_by: decoded.mongoUserId, used_at: new Date().toISOString() } }
      );

      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          mongoUserId: decoded.mongoUserId,
          username: mongoUser.username,
          email: mongoUser.email,
          plan: redeemData.plan
        },
        process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85',
        { expiresIn: '7d' }
      );

      (await cookies()).set({
        name: 'auth_token',
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Code redeemed successfully',
        data: {
          plan: redeemData.plan,
          plan_expires_at: redeemData.plan_expires_at
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error redeeming code:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}