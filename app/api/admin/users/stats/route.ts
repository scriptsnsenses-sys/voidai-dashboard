import { connectToDatabase, connectToV2Database, connectToUsagesDatabase } from '@/lib/mongodb';
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

      // Connect to both V1 and V2 databases
      const { db: v1Db } = await connectToDatabase();
      const { db: v2Db } = await connectToV2Database();
      
      // Get current date and calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get users by plan from both databases
      const v1UsersByPlan = await v1Db.collection('users').aggregate([
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const v2UsersByPlan = await v2Db.collection('users').aggregate([
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Combine plan counts from both databases
      const totalByPlan: Record<string, number> = {};
      v1UsersByPlan.forEach(item => {
        totalByPlan[item._id] = (totalByPlan[item._id] || 0) + item.count;
      });
      v2UsersByPlan.forEach(item => {
        totalByPlan[item._id] = (totalByPlan[item._id] || 0) + item.count;
      });

      // Get new users counts from both databases
      const v1NewUsersToday = await v1Db.collection('users').countDocuments({
        created_at: { $gte: today }
      });
      const v2NewUsersToday = await v2Db.collection('users').countDocuments({
        created_at: { $gte: today }
      });

      const v1NewUsersWeek = await v1Db.collection('users').countDocuments({
        created_at: { $gte: weekAgo }
      });
      const v2NewUsersWeek = await v2Db.collection('users').countDocuments({
        created_at: { $gte: weekAgo }
      });

      const v1NewUsersMonth = await v1Db.collection('users').countDocuments({
        created_at: { $gte: monthAgo }
      });
      const v2NewUsersMonth = await v2Db.collection('users').countDocuments({
        created_at: { $gte: monthAgo }
      });

      // Get active/inactive users from both databases (active = has logged in within last 30 days)
      const activeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const v1ActiveUsers = await v1Db.collection('users').countDocuments({
        last_login: { $gte: activeThreshold }
      });
      const v2ActiveUsers = await v2Db.collection('users').countDocuments({
        last_login: { $gte: activeThreshold }
      });

      const v1TotalUsers = await v1Db.collection('users').countDocuments({});
      const v2TotalUsers = await v2Db.collection('users').countDocuments({});

      // Combine stats from both databases
      const newUsersToday = v1NewUsersToday + v2NewUsersToday;
      const newUsersWeek = v1NewUsersWeek + v2NewUsersWeek;
      const newUsersMonth = v1NewUsersMonth + v2NewUsersMonth;
      const activeUsers = v1ActiveUsers + v2ActiveUsers;
      const totalUsers = v1TotalUsers + v2TotalUsers;
      const inactiveUsers = totalUsers - activeUsers;

      return NextResponse.json({
        totalByPlan,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        activeUsers,
        inactiveUsers
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}