import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

    if (!await isAdmin(decoded.userId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate what a 100-year subscription from that time would look like
    // (Any expiration date more than 50 years from now is likely a 100-year subscription)
    const fiftyYearsFromNow = now + (60 * 60 * 24 * 365 * 50);
    
    // Find users who have expiration dates far in the future (likely 100-year subscriptions)
    // and are non-monthly subscriptions (lifetime purchases)
    const problematicUsers = await db.collection('users').find({
      plan_expires_at: { 
        $gt: fiftyYearsFromNow,
        $exists: true,
        $ne: null
      },
      // Only target non-monthly subscriptions (lifetime purchases)
      subscription_id: { $in: [null, undefined] },
      // Make sure these are legitimate plans, not free users
      plan: { $in: ['economy', 'basic', 'premium', 'pro', 'ultra', 'enterprise'] }
    }).toArray();
    
    if (problematicUsers.length === 0) {
      return NextResponse.json({ 
        message: 'No users with 100-year subscriptions found',
        affectedCount: 0
      });
    }
    
    let updatedCount = 0;
    const errors: string[] = [];
    
    for (const user of problematicUsers) {
      try {
        // Calculate new expiration date: 1 year from when they originally purchased
        // We'll approximate their purchase time by subtracting ~100 years from their current expiration
        const currentExpiration = parseInt(user.plan_expires_at);
        const originalPurchaseTime = currentExpiration - (60 * 60 * 24 * 365 * 100);
        const newExpiration = originalPurchaseTime + (60 * 60 * 24 * 365 * 1); // 1 year from purchase
        
        // Update the user
        await db.collection('users').updateOne(
          { _id: user._id },
          { 
            $set: { 
              plan_expires_at: newExpiration,
              updated_at: new Date().toISOString(),
              // Add a note about the fix
              subscription_fix_applied: new Date().toISOString()
            } 
          }
        );
        
        // Also update their API keys
        await db.collection('keys').updateMany(
          { created_by: user._id.toString() },
          { 
            $set: { 
              updated_at: new Date().toISOString()
            } 
          }
        );
        
        updatedCount++;
        
      } catch (error) {
        errors.push(`Error updating user ${user._id}: ${error}`);
      }
    }
    
    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} users from 100-year to 1-year subscriptions`,
      affectedCount: updatedCount,
      totalFound: problematicUsers.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error fixing lifetime subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

    if (!await isAdmin(decoded.userId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate what a 100-year subscription from that time would look like
    // (Any expiration date more than 50 years from now is likely a 100-year subscription)
    const fiftyYearsFromNow = now + (60 * 60 * 24 * 365 * 50);
    
    // Find users who have expiration dates far in the future (likely 100-year subscriptions)
    const problematicUsers = await db.collection('users').find({
      plan_expires_at: { 
        $gt: fiftyYearsFromNow,
        $exists: true,
        $ne: null
      },
      // Only target non-monthly subscriptions (lifetime purchases)
      subscription_id: { $in: [null, undefined] },
      // Make sure these are legitimate plans, not free users
      plan: { $in: ['economy', 'basic', 'premium', 'pro', 'ultra', 'enterprise'] }
    }).toArray();
    
    // Return summary information
    const examples = problematicUsers.slice(0, 5).map(user => ({
      id: user._id,
      email: user.email,
      plan: user.plan,
      current_expiration: new Date(parseInt(user.plan_expires_at) * 1000).toISOString(),
      would_become: new Date((parseInt(user.plan_expires_at) - (60 * 60 * 24 * 365 * 100) + (60 * 60 * 24 * 365 * 1)) * 1000).toISOString()
    }));
    
    return NextResponse.json({ 
      totalAffected: problematicUsers.length,
      examples
    });

  } catch (error) {
    console.error('Error checking lifetime subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 