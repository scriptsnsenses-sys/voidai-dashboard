import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

// PUT update changelog entry (disabled - MongoDB removed)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85'
      ) as { userId: string };

      if (!(await isAdmin(decoded.userId))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Changelog feature disabled (no MongoDB). Replace with a PostgreSQL-backed implementation if needed.
      return NextResponse.json({ error: 'Changelog API disabled (MongoDB removed)' }, { status: 503 });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error handling changelog PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE changelog entry (disabled - MongoDB removed)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85'
      ) as { userId: string };

      if (!(await isAdmin(decoded.userId))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Changelog feature disabled (no MongoDB). Replace with a PostgreSQL-backed implementation if needed.
      return NextResponse.json({ error: 'Changelog API disabled (MongoDB removed)' }, { status: 503 });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error handling changelog DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}