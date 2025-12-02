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
  _id: string;
  email: string;
  plan: string;
  created_at: Date;
  password?: string;
  salt?: string;
  [key: string]: any;
}

interface SafeUser {
  _id: string;
  email: string;
  plan: string;
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

      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const plan = url.searchParams.get('plan') || 'all';
      const status = url.searchParams.get('status') || 'all';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const domain = url.searchParams.get('domain');

      const skip = (page - 1) * limit;

      // Build query based on filters
      const query: any = {};
      
      if (plan !== 'all') {
        if (plan === 'custom') {
          // Custom plans have rpm or rpd
          query.$or = [
            { rpm: { $exists: true } },
            { rpd: { $exists: true } }
          ];
        } else {
          query.plan = plan;
        }
      }
      
      if (status !== 'all') {
        query.status = status;
      }
      
      if (startDate || endDate) {
        query.created_at = {};
        if (startDate) {
          query.created_at.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.created_at.$lte = end;
        }
      }
      
      if (domain) {
        query.email = { $regex: `@${domain}$`, $options: 'i' };
      }

      const total = await db.collection('users').countDocuments(query);

      const users = await db.collection('users')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray() as unknown as User[];

      const safeUsers: SafeUser[] = users.map((user) => {
        const { password, salt, ...safeUser } = user;
        return safeUser;
      });

      return NextResponse.json({
        users: safeUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
