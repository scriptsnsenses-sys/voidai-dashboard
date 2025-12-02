import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import { getUserById as getV1UserById, ensureV2UserExists } from '@/lib/postgresql-users';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const prisma = getPrismaClient();

    // Get active/trialing subscribers from V1 (Mongo)
    const users = await db.collection('users')
      .find({ subscription_status: { $in: ['active', 'trialing'] } })
      .project({ _id: 1, username: 1, email: 1 })
      .toArray();

    const nowSec = Math.floor(Date.now() / 1000);
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Ensure we have an active API key in V2 (PostgreSQL)
        const apiKey = await prisma.apiKey.findFirst({
          where: { userId: user._id.toString(), isActive: true }
        });

        if (!apiKey) {
          skipped++;
          continue;
        }

        // External API currently accepts the searchHash for usage lookup
        const response = await fetch('https://api.voidai.app/v1/usage', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey.searchHash}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch usage for user ${user.username}`);
          skipped++;
          continue;
        }

        const usageData = await response.json();
        const externalUsed = Number(usageData?.usage?.perDay?.used || 0);

        // Ensure V2 user exists and is synced before recording usage
        const v1Full = await getV1UserById(user._id.toString());
        if (v1Full) {
          await ensureV2UserExists(v1Full);
        }

        const v2User = await prisma.user.findFirst({
          where: { id: user._id.toString() }
        });

        if (!v2User) {
          skipped++;
          continue;
        }

        // For cron job, we'll just sync the external usage to our credits
        // The external API already tracks the actual usage
        const currentCredits = Number(v2User.credits || BigInt(0));
        
        if (externalUsed > 0 && currentCredits > 0) {
          // Calculate how many credits should be deducted
          const creditsToDeduct = Math.min(currentCredits, externalUsed);
          const newCredits = Math.max(0, currentCredits - creditsToDeduct);
          
          // Update user credits and counters
          await prisma.user.update({
            where: { id: user._id.toString() },
            data: {
              credits: BigInt(newCredits),
              totalRequests: (v2User.totalRequests || 0) + 1,
              totalCreditsUsed: (v2User.totalCreditsUsed || 0) + creditsToDeduct,
              lastRequestAt: BigInt(nowSec),
              updatedAt: BigInt(nowSec)
            }
          });

          updated++;
        } else {
          skipped++;
        }

        processed++;
      } catch (err) {
        errors++;
        console.error(`Error processing user ${user.username}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} users • updated ${updated}, skipped ${skipped}, errors ${errors}`,
      timestamp: new Date(nowSec * 1000).toISOString()
    });
  } catch (error: any) {
    console.error('Error in usage recording cron job:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error recording usage' },
      { status: 500 }
    );
  }
}