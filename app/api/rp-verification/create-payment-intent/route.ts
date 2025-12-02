import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import stripe, { getOrCreateCustomer } from '@/lib/stripe';
import { getFullUserProfile } from '@/lib/postgresql-users';

const JWT_SECRET = process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85';

export async function POST(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        mongoUserId?: string;
        username: string;
        email: string;
        plan: string;
      };
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Use mongoUserId if available, otherwise fallback to userId for backward compatibility
    const userIdToUse = decoded.mongoUserId || decoded.userId;
    
    // Get full user profile (V1 + V2)
    const userProfile = await getFullUserProfile(userIdToUse);
    
    if (!userProfile) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const { v1User } = userProfile;

    // Only allow free users to verify
    if (v1User.plan !== 'free') {
      return NextResponse.json(
        { message: 'RP Models verification is only available for free users' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (v1User.rp_verified) {
      return NextResponse.json(
        { message: 'You are already verified for RP Models' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    const customerId = await getOrCreateCustomer(v1User.email, {
      user_id: v1User._id.toString(),
      username: v1User.username,
    });

    // Create payment intent for RP verification
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 250, // $2.50 in cents
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['card', 'paypal'],
      metadata: {
        user_id: v1User._id.toString(),
        type: 'rp_verification',
        email: v1User.email,
      },
      description: 'RP Models Verification - One-time payment to unlock roleplay models',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Error creating RP verification payment intent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}