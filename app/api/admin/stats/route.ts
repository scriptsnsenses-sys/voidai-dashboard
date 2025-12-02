import { connectToDatabase } from '@/lib/mongodb';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };

      // Use mongoUserId for admin checks (MongoDB ObjectId), fallback to userId for backward compatibility
      const mongoUserIdToUse = decoded.mongoUserId || decoded.userId;
      if (!await isAdmin(mongoUserIdToUse)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Connect to V1 MongoDB (authoritative for users)
      const { db: v1Db } = await connectToDatabase();
      // Get Prisma client for V2 PostgreSQL
      const prisma = getPrismaClient();

      // Get user counts from V1 MongoDB (authoritative source)
      const v1TotalUsers = await v1Db.collection('users').countDocuments();
      
      // Get V2 PostgreSQL user count
      const v2TotalUsers = await prisma.user.count();
      
      // For active users, check V1 MongoDB
      const currentTime = Math.floor(Date.now() / 1000);
      const v1ActiveUsers = await v1Db.collection('users').countDocuments({
        $or: [
          { plan_expires_at: null },
          { plan_expires_at: { $gt: currentTime.toString() } },
        ]
      });
      
      // V2 PostgreSQL active users
      const v2ActiveUsers = await prisma.user.count({
        where: {
          OR: [
            { planExpiresAt: BigInt(0) },
            { planExpiresAt: { gt: BigInt(currentTime) } },
          ]
        }
      });

      // Use V1 as the primary source for user stats (authoritative)
      const totalUsers = v1TotalUsers;
      const activeUsers = v1ActiveUsers;

      // Note: Claude applications have been deprecated and removed

      return NextResponse.json({
        totalUsers,
        activeUsers,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        // Include V2 stats separately for debugging/info
        v2Stats: {
          totalUsers: v2TotalUsers,
          activeUsers: v2ActiveUsers
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
