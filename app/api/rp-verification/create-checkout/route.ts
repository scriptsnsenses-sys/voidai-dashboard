import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import stripe, { getOrCreateCustomer } from '@/lib/stripe';
import { getFullUserProfile } from '@/lib/postgresql-users';

const JWT_SECRET = process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85';
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://voidai.app';
const RP_VERIFICATION_PRICE_ID = 'price_1S8nnfHHrax5hT3aOnEVpAkD';

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

    const { v1User, combined } = userProfile;

    // Only allow free users to verify
    if (combined.plan !== 'free') {
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

    // Create Stripe checkout session for RP verification with multiple payment methods
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'paypal', 'link', 'klarna'],
      line_items: [
        {
          price: RP_VERIFICATION_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN}/dashboard/billing?rp_success=true&session_id={CHECKOUT_SESSION_ID}&type=rp_verification`,
      cancel_url: `${DOMAIN}/dashboard/billing?canceled=true`,
      metadata: {
        user_id: v1User._id.toString(),
        type: 'rp_verification',
        email: v1User.email,
      },
      customer_update: {
        address: 'auto',
      },
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    });

  } catch (error) {
    console.error('Error creating RP verification checkout session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}