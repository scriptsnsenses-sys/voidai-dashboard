import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { connectToV2Database } from '@/lib/database-factory';
import { ObjectId } from 'mongodb';
import stripe from '@/lib/stripe';
import Stripe from 'stripe';
import { updateUserSubscription, updateV2UserPlan, getPlanRPD, getPlanRPM, updateUserRPVerification, ensureV2UserExists } from '@/lib/postgresql-users';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_bX9QddiTy8TB6FS2gNAYzCZ2ed0E4NYA';

if (!endpointSecret) {
  console.warn('WARNING: Missing Stripe webhook secret. Set STRIPE_WEBHOOK_SECRET for production use.');
}

// Helper function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { message: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { message: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Check for duplicate events and store the event in the V1 database
    try {
      const { db } = await connectToDatabase();
      
      // Check if we've already processed this event
      const existingEvent = await db.collection('webhook_events').findOne({
        event_id: event.id
      });
      
      if (existingEvent) {
        console.log(`Duplicate event ${event.id} of type ${event.type} - skipping processing`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      
      // Store the event for tracking
      await db.collection('webhook_events').insertOne({
        event_id: event.id,
        event_type: event.type,
        event: event,
        processed: false,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error storing webhook event:', error);
      // Continue processing even if storage fails
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleSubscriptionRenewal(invoice.subscription as string, invoice);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    try {
      const { db } = await connectToDatabase();
      await db.collection('webhook_events').updateOne(
        { event_id: event.id },
        { $set: { processed: true, processed_at: new Date().toISOString() } }
      );
    } catch (error) {
      console.error('Error marking event as processed:', error);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { message: 'Error handling webhook' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { db } = await connectToDatabase();

  const metadata = session.metadata || {};
  const userId = metadata.user_id;
  const plan = metadata.plan;
  const billingType = metadata.billing_type;
  const type = metadata.type;

  // Handle RP verification payments
  if (type === 'rp_verification') {
    return await handleRPVerificationPayment(session, userId);
  }

  if (!userId || !plan) {
    console.error('Missing required metadata in session', session.id, { userId, plan, metadata });
    return;
  }

  // Validate userId is a valid ObjectId
  if (!isValidObjectId(userId)) {
    console.error('Invalid user ID format in session metadata:', userId);
    return;
  }

  try {
    // Check if user exists in V1 database
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      console.error(`User not found with ID ${userId} for session ${session.id}`);
      return;
    }

    let subscriptionData: any = {
      plan,
      rpd: getPlanRPD(plan),
      rpm: getPlanRPM(plan)
    };

    // Handle subscription data
    if (session.subscription) {
      try {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        subscriptionData.subscription_id = subscription.id;
        subscriptionData.subscription_status = subscription.status;
        subscriptionData.plan_expires_at = subscription.current_period_end;
        subscriptionData.cancel_at_period_end = subscription.cancel_at_period_end;

        console.log(`Retrieved subscription ${subscription.id} for user ${userId}`);
      } catch (subscriptionError) {
        console.error('Error retrieving subscription:', subscriptionError);
        // For yearly plans, set a future expiration date even if subscription retrieval fails
        if (billingType === 'yearly') {
          const futureDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365);
          subscriptionData.plan_expires_at = futureDate;
          subscriptionData.subscription_id = null;
          subscriptionData.subscription_status = null;
        }
      }
    } else if (billingType === 'yearly') {
      // For yearly plans without subscription (one-time payments)
      const futureDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365);
      subscriptionData.plan_expires_at = futureDate;
      subscriptionData.subscription_id = null;
      subscriptionData.subscription_status = null;
    }

    // Update V1 database (primary)
    await updateUserSubscription(userId, subscriptionData);

    // Update V2 database (sync) and immediately reset credits for new plan
    try {
      // Ensure V2 (PostgreSQL) user exists before updating the plan
      await ensureV2UserExists(existingUser as any);
      await updateV2UserPlan(userId, plan, subscriptionData.plan_expires_at);
      
      // Immediately reset user credits to new plan limits
      const { getPrismaClient } = await import('@/lib/postgresql-prisma');
      const { getPlanCredits } = await import('@/lib/postgresql-users');
      const prisma = getPrismaClient();
      
      const newCredits = getPlanCredits(plan);
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: BigInt(newCredits),
          creditsLastReset: BigInt(Math.floor(Date.now() / 1000))
        }
      });
      
      console.log(`Successfully synced to V2 database and reset credits for user ${userId} to ${newCredits}`);
    } catch (v2Error) {
      console.error(`Failed to sync to V2 database for user ${userId}:`, v2Error);
      // Don't fail the whole process if V2 sync fails
    }

    console.log(`Successfully updated user ${userId} to plan ${plan} with subscription ${subscriptionData.subscription_id || 'none'}`);
  } catch (err) {
    console.error('Error updating user after successful payment:', err);
    
    // Log the error to the database for debugging
    try {
      await db.collection('payment_errors').insertOne({
        session_id: session.id,
        user_id: userId,
        plan,
        error: err instanceof Error ? err.message : String(err),
        metadata,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log payment error:', logError);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {};
  const userId = metadata.user_id;
  const type = metadata.type;

  // Handle RP verification payments
  if (type === 'rp_verification') {
    return await handleRPVerificationPaymentIntent(paymentIntent, userId);
  }

  console.log(`Unhandled payment intent type: ${type}`);
}

async function handleRPVerificationPaymentIntent(paymentIntent: Stripe.PaymentIntent, userId: string) {
  const { db } = await connectToDatabase();

  if (!userId) {
    console.error('Missing user_id in RP verification payment intent', paymentIntent.id);
    return;
  }

  // Validate userId is a valid ObjectId
  if (!isValidObjectId(userId)) {
    console.error('Invalid user ID format in RP verification payment intent metadata:', userId);
    return;
  }

  try {
    // Check if user exists in V1 database
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      console.error(`User not found with ID ${userId} for RP verification payment intent ${paymentIntent.id}`);
      return;
    }

    // Only allow free users to verify
    if (existingUser.plan !== 'free') {
      console.error(`RP verification attempted by non-free user ${userId} with plan ${existingUser.plan}`);
      return;
    }

    // Check if already verified
    if (existingUser.rp_verified) {
      console.log(`User ${userId} already verified for RP models`);
      return;
    }

    // Calculate bonus tokens expiry (30 days from now)
    const bonusExpiryTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    // Update user with RP verification data in MongoDB
    await updateUserRPVerification(userId, {
      rp_verified: true,
      rp_verification_date: new Date().toISOString(),
      rp_bonus_tokens_expires: bonusExpiryTimestamp.toString(),
      rp_discount_used: false
    });

    // Sync RP verification to PostgreSQL (V2 database)
    try {
      // Ensure V2 user exists
      await ensureV2UserExists(existingUser as any);
      
      // Update RP verification fields in PostgreSQL
      const { getPrismaClient } = await import('@/lib/postgresql-prisma');
      const prisma = getPrismaClient();
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          rpVerified: true,
          rpVerificationDate: BigInt(currentTimestamp),
          rpBonusTokensExpires: BigInt(bonusExpiryTimestamp),
          rpDiscountUsed: false,
          updatedAt: BigInt(currentTimestamp)
        }
      });
      
      console.log(`Successfully synced RP verification to PostgreSQL for user ${userId}`);
    } catch (v2Error) {
      console.error(`Failed to sync RP verification to PostgreSQL for user ${userId}:`, v2Error);
      // Don't fail the whole process if V2 sync fails, MongoDB update was successful
    }

    console.log(`Successfully verified RP models access for user ${userId} via payment intent`);
  } catch (err) {
    console.error('Error processing RP verification payment intent:', err);
    
    // Log the error to the database for debugging
    try {
      await db.collection('payment_errors').insertOne({
        payment_intent_id: paymentIntent.id,
        user_id: userId,
        type: 'rp_verification',
        error: err instanceof Error ? err.message : String(err),
        metadata: paymentIntent.metadata,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log RP verification payment intent error:', logError);
    }
  }
}

async function handleSubscriptionRenewal(subscriptionId: string, invoice?: Stripe.Invoice) {
  const { db } = await connectToDatabase();

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find user by subscription_id in V1 database
    const user = await db.collection('users').findOne({
      subscription_id: subscriptionId
    });

    if (!user) {
      console.error(`No user found with subscription ID ${subscriptionId}`);
      return;
    }

    const subscriptionData = {
      plan_expires_at: subscription.current_period_end,
      subscription_status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end
    };

    // Update V1 database
    await updateUserSubscription(user._id.toString(), subscriptionData);

    // Sync to V2 database
    try {
      // Ensure V2 (PostgreSQL) user exists before updating the plan
      await ensureV2UserExists(user as any);
      await updateV2UserPlan(user._id.toString(), user.plan, subscription.current_period_end);
      console.log(`Successfully synced renewal to V2 database for user ${user._id}`);
    } catch (v2Error) {
      console.error(`Failed to sync renewal to V2 database for user ${user._id}:`, v2Error);
    }

    console.log(`Successfully renewed subscription for user ${user._id}`);
  } catch (err) {
    console.error('Error handling subscription renewal:', err);
    
    // Log renewal errors for debugging
    try {
      await db.collection('payment_errors').insertOne({
        subscription_id: subscriptionId,
        error_type: 'renewal_failed',
        error: err instanceof Error ? err.message : String(err),
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log renewal error:', logError);
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { db } = await connectToDatabase();

  try {
    // Find user by subscription_id in V1 database
    const user = await db.collection('users').findOne({
      subscription_id: subscription.id
    });

    if (!user) {
      console.error(`No user found with subscription ID ${subscription.id}`);
      return;
    }

    const metadata = subscription.metadata || {};
    const subscriptionData: any = {
      plan_expires_at: subscription.current_period_end,
      subscription_status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end
    };

    if (metadata.plan) {
      subscriptionData.plan = metadata.plan;
      subscriptionData.rpd = getPlanRPD(metadata.plan);
      subscriptionData.rpm = getPlanRPM(metadata.plan);
    }

    // Update V1 database
    await updateUserSubscription(user._id.toString(), subscriptionData);

    // Sync to V2 database
    try {
      // Ensure V2 (PostgreSQL) user exists before updating the plan
      await ensureV2UserExists(user as any);
      const planToUse = metadata.plan || user.plan;
      await updateV2UserPlan(user._id.toString(), planToUse, subscription.current_period_end);
      console.log(`Successfully synced subscription update to V2 database for user ${user._id}`);
    } catch (v2Error) {
      console.error(`Failed to sync subscription update to V2 database for user ${user._id}:`, v2Error);
    }

    console.log(`Updated subscription data for user ${user._id}`);
  } catch (err) {
    console.error('Error handling subscription update:', err);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { db } = await connectToDatabase();

  try {
    // Find user by subscription_id in V1 database
    const user = await db.collection('users').findOne({
      subscription_id: subscription.id
    });

    if (!user) {
      console.error(`No user found with subscription ID ${subscription.id}`);
      return;
    }

    const currentPeriodEnd = subscription.current_period_end;

    const subscriptionData = {
      plan_expires_at: currentPeriodEnd,
      subscription_status: 'canceled',
      subscription_id: null,
      cancel_at_period_end: true
    };

    // Update V1 database
    await updateUserSubscription(user._id.toString(), subscriptionData);

    // Also set scheduled downgrade
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          scheduled_downgrade: {
            effective_date: currentPeriodEnd,
            new_plan: 'free',
            rpm: 5,
            rpd: 100
          }
        }
      }
    );

    // Sync to V2 database
    try {
      // Ensure V2 (PostgreSQL) user exists before updating the plan
      await ensureV2UserExists(user as any);
      await updateV2UserPlan(user._id.toString(), user.plan, currentPeriodEnd);
      console.log(`Successfully synced cancellation to V2 database for user ${user._id}`);
    } catch (v2Error) {
      console.error(`Failed to sync cancellation to V2 database for user ${user._id}:`, v2Error);
    }

    console.log(`Scheduled downgrade for user ${user._id} effective ${new Date(currentPeriodEnd * 1000).toISOString()}`);
  } catch (err) {
    console.error('Error handling subscription cancellation:', err);
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const { db } = await connectToDatabase();

  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    // Find user by subscription_id in V1 database
    const user = await db.collection('users').findOne({
      subscription_id: typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
    });

    if (!user) {
      console.error(`No user found for invoice ${invoice.id}`);
      return;
    }

    // Update payment failure status in V1 database
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          payment_failed: true,
          payment_failure_count: (user.payment_failure_count || 0) + 1,
          updated_at: new Date().toISOString()
        }
      }
    );

    console.log(`Payment failed for user ${user._id}, attempt ${(user.payment_failure_count || 0) + 1}`);
  } catch (err) {
    console.error('Error handling failed payment:', err);
  }
}

async function handleRPVerificationPayment(session: Stripe.Checkout.Session, userId: string) {
  const { db } = await connectToDatabase();

  if (!userId) {
    console.error('Missing user_id in RP verification session', session.id);
    return;
  }

  // Validate userId is a valid ObjectId
  if (!isValidObjectId(userId)) {
    console.error('Invalid user ID format in RP verification session metadata:', userId);
    return;
  }

  try {
    // Check if user exists in V1 database
    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      console.error(`User not found with ID ${userId} for RP verification session ${session.id}`);
      return;
    }

    // Only allow free users to verify
    if (existingUser.plan !== 'free') {
      console.error(`RP verification attempted by non-free user ${userId} with plan ${existingUser.plan}`);
      return;
    }

    // Check if already verified
    if (existingUser.rp_verified) {
      console.log(`User ${userId} already verified for RP models`);
      return;
    }

    // Calculate bonus tokens expiry (30 days from now)
    const bonusExpiryTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    // Update user with RP verification data in MongoDB
    await updateUserRPVerification(userId, {
      rp_verified: true,
      rp_verification_date: new Date().toISOString(),
      rp_bonus_tokens_expires: bonusExpiryTimestamp.toString(),
      rp_discount_used: false
    });

    // Sync RP verification to PostgreSQL (V2 database)
    try {
      // Ensure V2 user exists
      await ensureV2UserExists(existingUser as any);
      
      // Update RP verification fields in PostgreSQL
      const { getPrismaClient } = await import('@/lib/postgresql-prisma');
      const prisma = getPrismaClient();
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          rpVerified: true,
          rpVerificationDate: BigInt(currentTimestamp),
          rpBonusTokensExpires: BigInt(bonusExpiryTimestamp),
          rpDiscountUsed: false,
          updatedAt: BigInt(currentTimestamp)
        }
      });
      
      console.log(`Successfully synced RP verification to PostgreSQL for user ${userId}`);
    } catch (v2Error) {
      console.error(`Failed to sync RP verification to PostgreSQL for user ${userId}:`, v2Error);
      // Don't fail the whole process if V2 sync fails, MongoDB update was successful
    }

    console.log(`Successfully verified RP models access for user ${userId}`);
  } catch (err) {
    console.error('Error processing RP verification payment:', err);
    
    // Log the error to the database for debugging
    try {
      await db.collection('payment_errors').insertOne({
        session_id: session.id,
        user_id: userId,
        type: 'rp_verification',
        error: err instanceof Error ? err.message : String(err),
        metadata: session.metadata,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log RP verification payment error:', logError);
    }
  }
}