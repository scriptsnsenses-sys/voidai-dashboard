import { connectToDatabase, connectToV2Database } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];
async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
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

    // Delete user from both databases
    const v1Result = await v1Db.collection('users').deleteOne({ _id: new ObjectId(id) });
    const v2Result = await v2Db.collection('users').deleteOne({ _id: new ObjectId(id) });
    
    if (v1Result.deletedCount === 0 && v2Result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found in either database' }, { status: 404 });
    }

    // Delete API keys from both databases
    await v1Db.collection('keys').deleteMany({ created_by: id });
    await v2Db.collection('keys').deleteMany({ created_by: id });

    return NextResponse.json({
      success: true,
      message: 'User banned successfully from both databases',
      deletedFromV1: v1Result.deletedCount > 0,
      deletedFromV2: v2Result.deletedCount > 0
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
