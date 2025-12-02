import { connectToDatabase } from '@/lib/mongodb';
import stripe from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

interface UpcomingPayment {
  id: string;
  amount: number;
  currency: string;
  nextPaymentDate: string;
  plan: string;
  customerId: string;
  customer: {
    name: string | null;
    email: string | null;
  };
  user: {
    _id: string;
    username: string;
    email: string;
    plan: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    plan: {
      amount: number;
      currency: string;
      interval: string;
      product: string;
    };
  };
}

export async function GET(req: NextRequest) {
  try {
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

      const { db } = await connectToDatabase();
      const upcomingPayments: UpcomingPayment[] = [];

      try {
        // Fetch active subscriptions from Stripe
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          expand: ['data.customer', 'data.plan.product']
        });

        // For each active subscription, get the upcoming payment info
        for (const subscription of subscriptions.data) {
          try {
            // Get customer info
            const customer = subscription.customer as any;
            
            // Try to find the user in our database using the customer ID
            const user = await db.collection('users').findOne({
              customer_id: customer.id
            });

            // If no user found by customer_id, try to find by email
            let foundUser = user;
            if (!foundUser && customer.email) {
              foundUser = await db.collection('users').findOne({
                email: customer.email
              });
            }

            // Get the subscription item (should be the first one for most cases)
            const subscriptionItem = subscription.items.data[0];
            if (!subscriptionItem) continue;

            // Calculate next payment amount
            const planAmount = subscriptionItem.price.unit_amount ? subscriptionItem.price.unit_amount / 100 : 0; // Convert from cents
            
            // Get product name safely
            const productName = typeof subscriptionItem.price.product === 'object' && 
              subscriptionItem.price.product !== null && 
              'name' in subscriptionItem.price.product
              ? subscriptionItem.price.product.name 
              : 'Subscription';
            
            upcomingPayments.push({
              id: subscription.id,
              amount: planAmount,
              currency: subscriptionItem.price.currency || 'usd',
              nextPaymentDate: new Date(subscription.current_period_end * 1000).toISOString(),
              plan: subscriptionItem.price.nickname || productName,
              customerId: customer.id,
              customer: {
                name: customer.name,
                email: customer.email,
              },
              user: foundUser ? {
                _id: foundUser._id.toString(),
                username: foundUser.username,
                email: foundUser.email,
                plan: foundUser.plan
              } : null,
              subscription: {
                id: subscription.id,
                status: subscription.status,
                current_period_end: subscription.current_period_end,
                plan: {
                  amount: subscriptionItem.price.unit_amount || 0,
                  currency: subscriptionItem.price.currency || 'usd',
                  interval: subscriptionItem.price.recurring?.interval || 'month',
                  product: productName
                }
              }
            });
          } catch (error) {
            console.error(`Error processing subscription ${subscription.id}:`, error);
          }
        }

        // Sort by next payment date (soonest first)
        upcomingPayments.sort((a, b) => 
          new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
        );

        // Calculate some summary stats
        const totalUpcomingAmount = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const paymentsThisMonth = upcomingPayments.filter(payment => {
          const paymentDate = new Date(payment.nextPaymentDate);
          const now = new Date();
          return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
        });
        const paymentsNext30Days = upcomingPayments.filter(payment => {
          const paymentDate = new Date(payment.nextPaymentDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return paymentDate <= thirtyDaysFromNow;
        });

        return NextResponse.json({
          upcomingPayments,
          summary: {
            totalAmount: totalUpcomingAmount,
            totalCount: upcomingPayments.length,
            thisMonth: {
              amount: paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0),
              count: paymentsThisMonth.length
            },
            next30Days: {
              amount: paymentsNext30Days.reduce((sum, p) => sum + p.amount, 0),
              count: paymentsNext30Days.length
            }
          }
        });

      } catch (error) {
        console.error('Error fetching upcoming payments from Stripe:', error);
        return NextResponse.json({ error: 'Error fetching upcoming payments from Stripe' }, { status: 500 });
      }

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching upcoming payments data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 