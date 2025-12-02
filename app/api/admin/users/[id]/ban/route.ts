import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase, connectToV2Database } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const ADMIN_USER_IDS = [
  '67cc7156c48d8f091d9eb97e',
  '6841dcd68e5dd87c07fd43c4',
  '67cc75be88b956a5baebc71b'
];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { id: userIdToBan } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ''
    ) as {
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

    // Delete user from V1 database (auth)
    const v1DeleteResult = await v1Db
      .collection('users')
      .deleteOne({ _id: new ObjectId(userIdToBan) });

    // Delete user from V2 database (operations)
    const v2DeleteResult = await v2Db
      .collection('users')
      .deleteOne({ _id: new ObjectId(userIdToBan) });

    // Check if user was found in at least one database
    if (v1DeleteResult.deletedCount === 0 && v2DeleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found in either database' }, { status: 404 });
    }

    // Delete API keys from V2 database
    await v2Db.collection('keys').deleteMany({ created_by: userIdToBan });
    
    // Also delete from V1 database keys collection if it exists
    await v1Db.collection('keys').deleteMany({ created_by: userIdToBan });

    return NextResponse.json(
      { success: true, message: 'User banned successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
