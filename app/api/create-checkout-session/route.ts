import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/lib/postgresql-users';
import stripe, { STRIPE_PLANS, PLAN_DETAILS, getOrCreateCustomer } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { plan, billingType } = await req.json();

    if (!plan || !['economy', 'basic', 'premium', 'pro', 'ultra', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { message: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    if (!billingType || !['monthly', 'yearly'].includes(billingType)) {
      return NextResponse.json(
        { message: 'Invalid billing type' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

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

    const customerId = await getOrCreateCustomer(user.email, {
      user_id: user._id.toString(),
      username: user.username
    });

    let priceId;
    if (billingType === 'monthly') {
      priceId = plan === 'economy' ? STRIPE_PLANS.ECONOMY_MONTHLY :
                plan === 'basic' ? STRIPE_PLANS.BASIC_MONTHLY : 
                plan === 'premium' ? STRIPE_PLANS.PREMIUM_MONTHLY : 
                plan === 'pro' ? STRIPE_PLANS.PRO_MONTHLY :
                plan === 'ultra' ? STRIPE_PLANS.ULTRA_MONTHLY :
                STRIPE_PLANS.ENTERPRISE_MONTHLY;
    } else {
      priceId = plan === 'economy' ? STRIPE_PLANS.ECONOMY_YEARLY :
                plan === 'basic' ? STRIPE_PLANS.BASIC_YEARLY : 
                plan === 'premium' ? STRIPE_PLANS.PREMIUM_YEARLY : 
                plan === 'pro' ? STRIPE_PLANS.PRO_YEARLY :
                plan === 'ultra' ? STRIPE_PLANS.ULTRA_YEARLY :
                STRIPE_PLANS.ENTERPRISE_YEARLY;
    }

    const planInfo = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS];

    const rpmValue = plan === 'enterprise' ? 'unlimited' : (planInfo.rpm || 0).toString();
    const rpdValue = plan === 'enterprise' ? 'unlimited' : (planInfo.rpd || 0).toString();

    const metadata = {
      user_id: user._id.toString(),
      email: user.email,
      username: user.username,
      plan,
      billing_type: billingType,
      rpm: rpmValue,
      rpd: rpdValue
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://voidai.app';
    const success_url = `${baseUrl}/dashboard/billing/success`;
    const cancel_url = `${baseUrl}/dashboard/billing`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      mode: 'subscription',
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
      metadata,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      subscription_data: {
        metadata,
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { message: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}