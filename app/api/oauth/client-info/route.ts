import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/oauth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client_id' },
        { status: 400 }
      );
    }

    const client = await getOAuthClient(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Only return public info
    return NextResponse.json({
      name: client.name,
      client_id: client.clientId,
    });
  } catch (error) {
    console.error('OAuth client-info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
