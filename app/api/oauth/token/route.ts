import { NextRequest, NextResponse } from 'next/server';
import {
  getOAuthClient,
  hashClientSecret,
  consumeAuthorizationCode,
  createAccessToken,
  refreshAccessToken,
} from '@/lib/oauth';

export async function POST(req: NextRequest) {
  try {
    // Support both JSON and form-urlencoded
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    }

    const { grant_type, code, redirect_uri, client_id, client_secret, refresh_token } = body;

    // Validate client credentials
    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing client credentials' },
        { status: 400 }
      );
    }

    const client = await getOAuthClient(client_id);
    if (!client) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Unknown client' },
        { status: 401 }
      );
    }

    // Verify client secret
    if (hashClientSecret(client_secret) !== client.clientSecretHash) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client secret' },
        { status: 401 }
      );
    }

    // Handle different grant types
    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing code or redirect_uri' },
          { status: 400 }
        );
      }

      // Consume the authorization code
      const authCode = await consumeAuthorizationCode(code, client_id, redirect_uri);
      if (!authCode) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
          { status: 400 }
        );
      }

      // Create access token
      const tokens = await createAccessToken(client_id, authCode.userId, authCode.scope || undefined);

      return NextResponse.json({
        access_token: tokens.accessToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
        scope: authCode.scope || '',
      });
    } else if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing refresh_token' },
          { status: 400 }
        );
      }

      const tokens = await refreshAccessToken(refresh_token);
      if (!tokens) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        access_token: tokens.accessToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
      });
    } else {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code and refresh_token are supported' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('OAuth token error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
