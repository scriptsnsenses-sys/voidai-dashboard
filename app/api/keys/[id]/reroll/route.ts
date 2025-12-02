import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { cryptoService } from '@/lib/crypto-service';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(
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
        username: string;
        plan: string;
      };

      const userIdToUse = decoded.mongoUserId || decoded.userId;
      const keyId = params.id;
      
      const prisma = getPrismaClient();
      
      // Verify the API key belongs to the user
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          userId: userIdToUse,
          isActive: true
        }
      });

      if (!existingKey) {
        return NextResponse.json(
          { message: 'API key not found or does not belong to you' },
          { status: 404 }
        );
      }

      // Generate new API key
      const newApiKey = cryptoService.generateApiKey();
      
      // Create masked version for display
      const maskedKey = `sk-voidai...${newApiKey.substring(newApiKey.length - 5)}`;
      
      // Hash the new API key
      const hashedApiKey = await cryptoService.hash(newApiKey);
      const [encrypted, salt] = hashedApiKey.split(':');
      const searchHash = cryptoService.createHmac('search-hash', newApiKey);

      // Update the existing API key with new values
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          encrypted: encrypted,
          salt: salt,
          searchHash: searchHash,
          maskedKey: maskedKey,
          lastUsedAt: null // Reset last used time
        }
      });

      return NextResponse.json({
        message: 'API key rerolled successfully',
        key: newApiKey,
        maskedKey: maskedKey
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error rerolling API key:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}