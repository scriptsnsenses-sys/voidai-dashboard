import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { createV2ApiKey } from '@/lib/postgresql-users';
import { cryptoService } from '@/lib/crypto-service';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getIpAddress, verifyHCaptchaToken } from '@/lib/hcaptcha';

export async function POST(req: NextRequest) {
  try {

    const { hcaptchaToken } = await req.json();
    
    if (process.env.NODE_ENV !== 'development') {
      if (!hcaptchaToken) {
        return NextResponse.json({ message: 'CAPTCHA token is required' }, { status: 400 });
      }

      const ip = getIpAddress(req);
      const isCaptchaValid = await verifyHCaptchaToken(hcaptchaToken, ip);
      if (!isCaptchaValid) {
        return NextResponse.json({ message: 'CAPTCHA validation failed' }, { status: 400 });
      }
    }

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
      
      const prisma = getPrismaClient();
      
      const user = await prisma.user.findFirst({
        where: {
          id: userIdToUse
        },
        include: {
          apiKeys: {
            where: {
              isActive: true
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found in V2 database. Please run the V1 to V2 migration script first.' },
          { status: 404 }
        );
      }

      if (user.enabled === false) {
        return NextResponse.json(
          { message: 'User account is disabled' },
          { status: 403 }
        );
      }

      // Check current API key count
      const currentKeys = user.apiKeys || [];
      
      if (currentKeys.length >= 5) {
        return NextResponse.json(
          { message: 'You have reached the maximum limit of 5 API keys.' },
          { status: 400 }
        );
      }

      // Generate new API key using the exact same method as the server
      const apiKey = cryptoService.generateApiKey();
      
      // Create masked version for display
      const maskedKey = `sk-voidai...${apiKey.substring(apiKey.length - 5)}`;
      
      // Hash the API key using the exact same method as the server
      const hashedApiKey = await cryptoService.hash(apiKey);
      const [encrypted, salt] = hashedApiKey.split(':');
      const searchHash = cryptoService.createHmac('search-hash', apiKey);

      // Create the API key in PostgreSQL
      const newApiKey = await createV2ApiKey(user.id, {
        name: `API Key ${currentKeys.length + 1}`,
        encrypted: encrypted,
        salt: salt,
        algorithm: 'bcrypt',
        searchHash: searchHash,
        maskedKey: maskedKey
      });

      if (!newApiKey) {
        return NextResponse.json(
          { message: 'Failed to generate API key' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'API key generated successfully',
        key: apiKey,
        id: newApiKey.id
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
