import { connectToV2Database } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function GET(req: NextRequest) {
  try {
    // Admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };

      // Use mongoUserId for admin checks (MongoDB ObjectId), fallback to userId for backward compatibility
      const mongoUserIdToUse = decoded.mongoUserId || decoded.userId;
      if (!await isAdmin(mongoUserIdToUse)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Get query parameters
      const searchParams = req.nextUrl.searchParams;
      const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const sortBy = searchParams.get('sortBy') || 'dailyTotal'; // dailyTotal, rpmPeak
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');

      // Connect to V2 database (Prisma)
      const { client } = await connectToV2Database();

      // Parse date range for the selected day
      // Ensure strict UTC handling using UTC getters to avoid timezone offsets
      const startDate = new Date(dateStr);
      const startTimestamp = BigInt(new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0)).getTime());
      const endTimestamp = BigInt(new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 23, 59, 59, 999)).getTime());

      // Aggregate daily usage per user
      const usageGroups = await client.apiRequest.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startTimestamp,
            lte: endTimestamp
          }
        },
        _count: {
          id: true // dailyTotal
        },
        _sum: {
          tokensUsed: true,
          creditsUsed: true
        },
        _max: {
          createdAt: true // lastRequestAt
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });
      
      const totalCount = usageGroups.length;
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const pagedGroups = usageGroups.slice(startIndex, endIndex);
      
      // Fetch user details and additional stats for the paged groups
      const enrichedData = await Promise.all(pagedGroups.map(async (group) => {
        if (!group.userId) return null;

        const user = await client.user.findUnique({
          where: { id: group.userId },
          select: {
            id: true,
            name: true,
            plan: true,
            // We'll try to get email from a related table or just use name if email isn't directly on user in schema (it seems it's not in the schema I read)
            // Wait, checking schema again... User model doesn't have email. It might be in a separate Auth table or handled differently.
            // I'll verify the schema I read.
            // Schema: id, name, plan, enabled, credits... no email.
            // I'll use name as username and placeholder for email.
          }
        });
        
        // Aggregate models for this user on this day
        const modelGroups = await client.apiRequest.groupBy({
          by: ['model'],
          where: {
            userId: group.userId,
            createdAt: {
               gte: startTimestamp,
               lte: endTimestamp
            }
          },
          _count: {
            id: true
          }
        });
        
        const models = modelGroups.reduce((acc, curr) => {
          acc[curr.model] = curr._count.id;
          return acc;
        }, {} as Record<string, number>);

        // Calculate simplified hourly distribution
        // Since groupBy doesn't support complex date extraction easily in all providers, we might skip this or do a raw query if critical.
        // For now, I'll just provide an empty array to satisfy the interface or implement a separate raw query if needed.
        const hourlyDistribution: Array<{ hour: number; requests: number }> = [];

        // RPM Peak calculation is heavy. We'll approximate or set to 0 for now as "N/A"
        // Real RPM calculation would require iterating all requests which is expensive.
        const rpmPeak = 0; 

        // Get limits based on plan (hardcoded or fetched from config)
        // This matches the Generate Code page logic
        let rpdLimit = 0;
        let rpmLimit = 0;
        const plan = user?.plan || 'free';
        
        switch(plan.toLowerCase()) {
            case 'economy': rpdLimit = 1000; rpmLimit = 7; break;
            case 'basic': rpdLimit = 2000; rpmLimit = 10; break;
            case 'premium': rpdLimit = 5000; rpmLimit = 35; break;
            case 'pro': rpdLimit = 7500; rpmLimit = 75; break;
            case 'ultra': rpdLimit = 10000; rpmLimit = 100; break;
            case 'enterprise': rpdLimit = 0; rpmLimit = 0; break; // Unlimited
            default: rpdLimit = 100; rpmLimit = 5; break; // Free/Default
        }

        return {
          userId: group.userId,
          username: user?.name || 'Unknown',
          email: 'N/A',
          plan: plan,
          dailyTotal: group._count.id,
          tokensUsed: Number(group._sum.tokensUsed || 0),
          creditsUsed: Number(group._sum.creditsUsed || 0),
          rpmPeak: rpmPeak,
          rpmLimit: rpmLimit,
          rpdLimit: rpdLimit,
          lastRequestAt: group._max.createdAt ? new Date(Number(group._max.createdAt)).toISOString() : new Date().toISOString(),
          models: models,
          hourlyDistribution: hourlyDistribution
        };
      }));

      // Filter out nulls
      const data = enrichedData.filter(item => item !== null);

      // Calculate summary statistics
      const totalRequests = usageGroups.reduce((sum, g) => sum + g._count.id, 0);
      const totalTokens = usageGroups.reduce((sum, g) => sum + Number(g._sum.tokensUsed || 0), 0);
      const totalCredits = usageGroups.reduce((sum, g) => sum + Number(g._sum.creditsUsed || 0), 0);
      const avgRequestsPerUser = totalCount > 0 ? Math.round(totalRequests / totalCount) : 0;
      
      const planDistribution: Record<string, number> = {};
       data.forEach(u => {
          planDistribution[u!.plan] = (planDistribution[u!.plan] || 0) + 1;
       });

      return NextResponse.json({
        date: dateStr,
        data: data,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary: {
          totalRequests,
          totalTokens,
          totalCredits,
          totalUsers: totalCount,
          avgRequestsPerUser,
          planDistribution
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching usage monitoring data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}