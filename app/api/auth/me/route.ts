import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getFullUserProfile, updateUserPlan } from '@/lib/postgresql-users';

export async function GET(req: NextRequest) {
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
        email: string;
        plan: string;
      };

      // Use mongoUserId if available, otherwise fallback to userId for backward compatibility
      const userIdToUse = decoded.mongoUserId || decoded.userId;
      
      // Get full user profile (V1 + V2)
      const userProfile = await getFullUserProfile(userIdToUse);
      
      if (!userProfile) {
        (await cookies()).delete('auth_token');
        return NextResponse.json(
          { message: 'User not found' },
          { status: 401 }
        );
      }

      const { v1User, v2User, combined } = userProfile;

      // Check verification status
      if (!v1User.is_verified) {
        (await cookies()).delete('auth_token');
        return NextResponse.json(
          {
            message: 'Email not verified',
            requiresVerification: true,
            email: v1User.email
          },
          { status: 403 }
        );
      }

      // Check plan expiration from V1 database
      if (v1User.plan !== 'free' && v1User.plan_expires_at) {
        const expirationDate = new Date(parseInt(v1User.plan_expires_at) * 1000);
        if (expirationDate < new Date()) {
          // Update plan in both databases
          await updateUserPlan(v1User._id.toString(), 'free');
          
          // Update the combined result
          combined.plan = 'free';
          combined.plan_expires_at = null;
        }
      }

      return NextResponse.json(combined);
    } catch (error) {
      (await cookies()).delete('auth_token');
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}