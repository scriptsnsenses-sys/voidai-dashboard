import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { updateMaskedKeyIfMissing } from '@/lib/masked-key-utils';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface DecodedToken {
  userId: string;
  mongoUserId?: string;
}

interface MaskedApiKey {
  _id: string;
  masked_key: string;
  created_at: string;
  enabled: boolean;
  plan: string;
  label?: string;
}

export async function GET(req: NextRequest) {
  try {
    const cookiesList = await cookies();
    const token = cookiesList.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as DecodedToken;

      // Use mongoUserId if available, otherwise fallback to userId
      const userIdToUse = decoded.mongoUserId || decoded.userId;
      
      
      // Get user and API keys from PostgreSQL using Prisma
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

      // Get API keys separately to avoid maskedKey issues
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          userId: userIdToUse,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Transform API keys to the expected format and handle missing masked keys
      const maskedKeys: MaskedApiKey[] = apiKeys.map((apiKey: any) => {
        return {
          _id: apiKey.id,
          masked_key: apiKey.maskedKey || 'sk-voidai...••••• (legacy key)',
          created_at: new Date(Number(apiKey.createdAt) * 1000).toISOString(),
          enabled: apiKey.isActive,
          plan: user.plan,
          label: apiKey.name
        };
      });

      return NextResponse.json({ keys: maskedKeys });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}