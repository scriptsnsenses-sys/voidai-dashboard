import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { Document, WithId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];
async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

interface User {
  username: string;
  email: string;
  password: string;
  salt: string;
  created_at: Date;
  [key: string]: any;
}

interface SafeUser {
  username: string;
  email: string;
  created_at: Date;
  [key: string]: any;
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

      const { db } = await connectToDatabase();
      const url = new URL(req.url);

      const searchTerm = url.searchParams.get('q') || '';

      if (!searchTerm) {
        return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
      }

      const users = await db.collection('users')
        .find({
          $or: [
            { username: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray() as unknown as User[];

      const safeUsers: SafeUser[] = users.map((user) => {
        const { password, salt, ...safeUser } = user;
        return safeUser;
      });

      return NextResponse.json({
        users: safeUsers,
        total: safeUsers.length
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
