import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import stripe from '@/lib/stripe';
import Stripe from 'stripe';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription']
    });

    const { db } = await connectToDatabase();

    interface CheckoutSessionResponse {
      id: string;
      status: Stripe.Checkout.Session.Status | null;
      customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
      customerEmail: string | null | undefined;
      amount: number | null;
      currency: string | null;
      paymentStatus: string | null;
      plan: string;
      billingType: string | undefined;
      rpm: number | null;
      rpd: number | null;
      subscriptionId?: string;
      currentPeriodStart?: number;
      currentPeriodEnd?: number;
      cancelAtPeriodEnd?: boolean;
    }

    const responseData: CheckoutSessionResponse = {
      id: session.id,
      status: session.status,
      customer: session.customer,
      customerEmail: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      plan: session.metadata?.plan || 'unknown',
      billingType: session.metadata?.billing_type,
      rpm: session.metadata?.rpm ? parseInt(session.metadata.rpm) : null,
      rpd: session.metadata?.rpd ? parseInt(session.metadata.rpd) : null,
    };

    if (session.subscription && typeof session.subscription !== 'string') {
      responseData.subscriptionId = session.subscription.id;
      responseData.currentPeriodStart = session.subscription.current_period_start;
      responseData.currentPeriodEnd = session.subscription.current_period_end;
      responseData.cancelAtPeriodEnd = session.subscription.cancel_at_period_end;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { message: 'Error retrieving checkout session' },
      { status: 500 }
    );
  }
}