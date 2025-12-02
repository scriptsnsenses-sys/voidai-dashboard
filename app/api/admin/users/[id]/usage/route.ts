import { connectToDatabase, connectToUsagesDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

      if (!await isAdmin(decoded.userId)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const userId = id;

      // Try to connect to usages database
      let totalApiCalls = 0;
      let lastUsageDate = null;
      
      try {
        const { db: usagesDb } = await connectToUsagesDatabase();
        
        // Get all usage records for this user
        const usageRecords = await usagesDb.collection('usages')
          .find({ userId })
          .sort({ timestamp: -1 })
          .toArray();

        // Calculate total API calls by summing all daily usage
        totalApiCalls = usageRecords.reduce((total, record) => {
          return total + (record.rpdUsed || 0);
        }, 0);

        // Get the most recent usage date
        if (usageRecords.length > 0) {
          lastUsageDate = usageRecords[0].timestamp;
        }

        // Get current usage from the most recent record
        const currentUsage = usageRecords.length > 0 ? {
          rpmUsed: usageRecords[0].rpmUsed || 0,
          rpmLimit: usageRecords[0].rpmLimit || 0,
          rpdUsed: usageRecords[0].rpdUsed || 0,
          rpdLimit: usageRecords[0].rpdLimit || 0,
        } : null;

        return NextResponse.json({
          totalApiCalls,
          lastUsageDate,
          currentUsage,
          usageHistory: usageRecords.slice(0, 30) // Last 30 records
        });

      } catch (usageDbError) {
        console.warn('Could not fetch usage data:', usageDbError);
        
        // Return partial data if usages database is not available
        return NextResponse.json({
          totalApiCalls: 0,
          lastUsageDate: null,
          currentUsage: null,
          usageHistory: [],
          warning: 'Usage data not available'
        });
      }

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching user usage data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}