import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getOAuthClient, validateRedirectUri, createAuthorizationCode } from '@/lib/oauth';
import { getFullUserProfile } from '@/lib/postgresql-users';

// GET: Validate OAuth request and redirect to authorize page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const responseType = searchParams.get('response_type');
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!clientId || !redirectUri || responseType !== 'code') {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    // Validate client
    const client = await getOAuthClient(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Unknown client' },
        { status: 400 }
      );
    }

    // Validate redirect URI
    const isValidRedirect = await validateRedirectUri(clientId, redirectUri);
    if (!isValidRedirect) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid redirect URI' },
        { status: 400 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voidai.app';

    // Check if user is logged in
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      // Redirect to login with return URL
      const returnUrl = `/oauth/authorize?${searchParams.toString()}`;
      return NextResponse.redirect(`${baseUrl}/login?from=${encodeURIComponent(returnUrl)}`);
    }

    // Verify JWT
    let decoded: { userId: string; mongoUserId?: string; email: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
    } catch {
      const returnUrl = `/oauth/authorize?${searchParams.toString()}`;
      return NextResponse.redirect(`${baseUrl}/login?from=${encodeURIComponent(returnUrl)}`);
    }

    // Redirect to authorize page (where user can approve/deny)
    const authorizePageUrl = new URL('/oauth/authorize', baseUrl);
    authorizePageUrl.searchParams.set('client_id', clientId);
    authorizePageUrl.searchParams.set('redirect_uri', redirectUri);
    authorizePageUrl.searchParams.set('scope', scope || '');
    if (state) authorizePageUrl.searchParams.set('state', state);

    return NextResponse.redirect(authorizePageUrl);
  } catch (error) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: User approved the authorization
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, redirect_uri, scope, state, action } = body;

    // Check if user denied
    if (action === 'deny') {
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('error_description', 'User denied the request');
      if (state) redirectUrl.searchParams.set('state', state);
      return NextResponse.json({ redirect: redirectUrl.toString() });
    }

    // Validate client
    const client = await getOAuthClient(client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Unknown client' },
        { status: 400 }
      );
    }

    // Validate redirect URI
    const isValidRedirect = await validateRedirectUri(client_id, redirect_uri);
    if (!isValidRedirect) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid redirect URI' },
        { status: 400 }
      );
    }

    // Get user from token
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'unauthorized', error_description: 'Not logged in' },
        { status: 401 }
      );
    }

    let decoded: { userId: string; mongoUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
    } catch {
      return NextResponse.json(
        { error: 'unauthorized', error_description: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.mongoUserId || decoded.userId;

    // Create authorization code
    const code = await createAuthorizationCode(client_id, userId, redirect_uri, scope);

    // Build redirect URL
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);

    return NextResponse.json({ redirect: redirectUrl.toString() });
  } catch (error) {
    console.error('OAuth authorize POST error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
