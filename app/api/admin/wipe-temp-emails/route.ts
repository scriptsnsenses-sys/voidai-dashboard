export const runtime = 'nodejs';
import { getDisposableDomains } from '@/app/api/auth/register/route';
import { connectToDatabase, connectToV2Database } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };

      // Use mongoUserId for admin checks (MongoDB ObjectId), fallback to userId for backward compatibility
      const mongoUserIdToUse = decoded.mongoUserId || decoded.userId;
      if (!await isAdmin(mongoUserIdToUse)) {
        return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
      }

      // Connect to both V1 and V2 databases
      const { db: v1Db } = await connectToDatabase();
      const { db: v2Db } = await connectToV2Database();
      
      // Get all disposable domains including our custom ones
      const disposableDomains = await getDisposableDomains();
      
      // Find all users with emails from disposable domains in both databases
      const v1Users = await v1Db.collection('users').find({}).toArray();
      const v2Users = await v2Db.collection('users').find({}).toArray();
      
      const v1UsersToDelete: ObjectId[] = [];
      const v2UsersToDelete: ObjectId[] = [];
      
      // Check V1 users
      for (const user of v1Users) {
        if (!user.email) continue;
        
        const emailParts = user.email.toLowerCase().split('@');
        if (emailParts.length !== 2) continue;
        
        const domain = emailParts[1];
        if (disposableDomains.has(domain)) {
          v1UsersToDelete.push(new ObjectId(user._id));
        }
      }
      
      // Check V2 users
      for (const user of v2Users) {
        if (!user.email) continue;
        
        const emailParts = user.email.toLowerCase().split('@');
        if (emailParts.length !== 2) continue;
        
        const domain = emailParts[1];
        if (disposableDomains.has(domain)) {
          v2UsersToDelete.push(new ObjectId(user._id));
        }
      }
      
      if (v1UsersToDelete.length === 0 && v2UsersToDelete.length === 0) {
        return NextResponse.json(
          { message: 'No users found with temporary email addresses in either database' },
          { status: 200 }
        );
      }
      
      // Delete users from both databases
      let totalDeleted = 0;
      
      if (v1UsersToDelete.length > 0) {
        const v1DeleteResult = await v1Db.collection('users').deleteMany({
          _id: { $in: v1UsersToDelete }
        });
        totalDeleted += v1DeleteResult.deletedCount;
        
        // Also delete their API keys from V1
        await v1Db.collection('keys').deleteMany({
          created_by: { $in: v1UsersToDelete.map(id => id.toString()) }
        });
      }
      
      if (v2UsersToDelete.length > 0) {
        const v2DeleteResult = await v2Db.collection('users').deleteMany({
          _id: { $in: v2UsersToDelete }
        });
        totalDeleted += v2DeleteResult.deletedCount;
        
        // Also delete their API keys from V2
        await v2Db.collection('keys').deleteMany({
          created_by: { $in: v2UsersToDelete.map(id => id.toString()) }
        });
      }
      
      return NextResponse.json(
        {
          message: 'Users with temporary email addresses deleted successfully from both databases',
          deleted: totalDeleted,
          v1Deleted: v1UsersToDelete.length,
          v2Deleted: v2UsersToDelete.length
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error wiping temporary email users:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 
