import { NextRequest, NextResponse } from 'next/server';
import { validateAccessToken } from '@/lib/oauth';
import { getFullUserProfile } from '@/lib/postgresql-users';
import { getSignedProfilePictureUrl } from '@/lib/r2';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Validate the access token
    const accessToken = await validateAccessToken(token);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Invalid or expired access token' },
        { status: 401 }
      );
    }

    // Get user profile
    const userProfile = await getFullUserProfile(accessToken.userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'User not found' },
        { status: 401 }
      );
    }

    const { v1User, v2User, combined } = userProfile;

    // Generate signed URL for profile picture
    const pictureUrl = await getSignedProfilePictureUrl(v1User.profile_picture);

    // Return user info (OpenID Connect-like format)
    return NextResponse.json({
      sub: accessToken.userId,
      email: v1User.email,
      email_verified: v1User.is_verified,
      name: v1User.username,
      picture: pictureUrl,
      plan: combined.plan,
      credits: combined.credits?.toString(),
      created_at: v1User.created_at,
    });
  } catch (error) {
    console.error('OAuth userinfo error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
