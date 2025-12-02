import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

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

      const { label } = await req.json();

      if (typeof label !== 'string') {
        return NextResponse.json(
          { message: 'Label must be a string' },
          { status: 400 }
        );
      }

      if (label.length > 50) {
        return NextResponse.json(
          { message: 'Label must be 50 characters or less' },
          { status: 400 }
        );
      }

      // Use mongoUserId if available, otherwise fallback to userId
      const userIdToUse = decoded.mongoUserId || decoded.userId;
      
      // Get user and API key from PostgreSQL using Prisma
      const prisma = getPrismaClient();
      
      const user = await prisma.user.findFirst({
        where: {
          id: userIdToUse
        }
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Find the API key by ID
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: params.id,
          userId: user.id
        }
      });

      if (!apiKey) {
        return NextResponse.json(
          { message: 'API key not found' },
          { status: 404 }
        );
      }

      // Update the API key label (name)
      const updatedKey = await prisma.apiKey.update({
        where: {
          id: params.id
        },
        data: {
          name: label
        }
      });

      return NextResponse.json({
        message: 'API key label updated successfully',
        key: {
          _id: updatedKey.id,
          masked_key: updatedKey.maskedKey,
          created_at: new Date(Number(updatedKey.createdAt) * 1000).toISOString(),
          enabled: updatedKey.isActive,
          label: updatedKey.name
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
    console.error('Error updating API key label:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}