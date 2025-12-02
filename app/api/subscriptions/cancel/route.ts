import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById, updateUserSubscription } from '@/lib/postgresql-users';
import { cancelSubscription } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
      userId: string;
      mongoUserId?: string;
      username: string;
      email: string;
    };

    // Get user from V1 database (primary auth source)
    const userIdToUse = decoded.mongoUserId || decoded.userId;
    const user = await getUserById(userIdToUse);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.subscription_id) {
      return NextResponse.json(
        { message: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe
    const cancelled = await cancelSubscription(user.subscription_id);

    if (!cancelled) {
      return NextResponse.json(
        { message: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Update user subscription status in V1 database
    await updateUserSubscription(user._id.toString(), {
      cancel_at_period_end: true
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { message: 'Error canceling subscription' },
      { status: 500 }
    );
  }
}