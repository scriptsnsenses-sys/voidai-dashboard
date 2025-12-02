import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

// GET all changelog entries
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

      if (!await isAdmin(decoded.userId)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { db } = await connectToDatabase();
      
      const entries = await db.collection('changelog')
        .find({})
        .sort({ date: -1, created_at: -1 })
        .toArray();

      return NextResponse.json({ entries });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching changelog entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST new changelog entry
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

      if (!await isAdmin(decoded.userId)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { db } = await connectToDatabase();
      const data = await req.json();
      
      const entry = {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: decoded.userId
      };

      const result = await db.collection('changelog').insertOne(entry);

      return NextResponse.json({ 
        success: true, 
        id: result.insertedId,
        message: 'Changelog entry created successfully' 
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating changelog entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}