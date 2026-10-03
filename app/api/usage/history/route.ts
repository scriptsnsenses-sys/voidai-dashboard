import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { getFullUserProfile } from '@/lib/postgresql-users';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - Missing authentication token' },
        { status: 401 }
      );
    }

    let decoded: { userId: string; mongoUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
        mongoUserId?: string;
      };
    } catch (error) {
      console.error('Token verification error:', error);
      (await cookies()).delete('auth_token');
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userIdToUse = decoded.mongoUserId || decoded.userId;
    const prisma = getPrismaClient();

    // Verify user exists and is enabled via V1/V2 profile
    const profile = await getFullUserProfile(userIdToUse);
    if (!profile) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Allow disabled users to view their history to understand usage
    /* if (!combined.enabled) {
      return NextResponse.json(
        { message: 'User account is disabled' },
        { status: 403 }
      );
    } */

    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || 'day';
    const limitParam = searchParams.get('limit') || '24';

    const period = periodParam as 'hour' | 'day' | 'week' | 'month';
    const limit = parseInt(limitParam);

    const now = new Date();
    const startTime = new Date();

    // Set start time based on period (Current window)
    // period=hour  -> Start of current hour (minute granularity)
    // period=day   -> Start of current day (hour granularity)
    // period=week  -> Start of current week (day granularity)
    // period=month -> Start of current month (day granularity)
    
    let truncInterval: string;

    switch (period) {
      case 'hour':
        startTime.setMinutes(0, 0, 0); // Start of current hour
        truncInterval = 'minute';
        break;
      case 'day':
      default:
        startTime.setHours(0, 0, 0, 0); // Start of today
        truncInterval = 'hour';
        break;
      case 'week':
        // Last 7 days (Rolling window)
        startTime.setDate(startTime.getDate() - 7);
        startTime.setHours(0, 0, 0, 0);
        truncInterval = 'day';
        break;
      case 'month':
        // Last 30 days (Rolling window)
        startTime.setDate(startTime.getDate() - 30);
        startTime.setHours(0, 0, 0, 0);
        truncInterval = 'day';
        break;
    }

    const startTimestamp = BigInt(startTime.getTime());

    // Use raw query to aggregate data
    // Cast BigInt to standard integer for summing if needed, though Prisma handles BigInts
    // Note: created_at is stored as BigInt ms timestamp
    const historyRaw: any[] = await prisma.$queryRaw`
      SELECT
        date_trunc(${truncInterval}, to_timestamp(created_at / 1000)) as timestamp,
        COUNT(*) as requests
      FROM api_requests
      WHERE user_id = ${userIdToUse}
        AND created_at >= ${startTimestamp}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Process and format the results
    // Convert BigInts to numbers for JSON response
    const history = historyRaw.map(entry => ({
      timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date(entry.timestamp).toISOString(),
      requests: Number(entry.requests || 0)
    }));

    // Fill in gaps if necessary (optional improvement)

    return NextResponse.json({
      history,
      period: periodParam,
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching usage history:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error fetching usage history' },
      { status: 500 }
    );
  }
}