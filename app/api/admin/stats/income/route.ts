import stripe from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

interface MonthlyIncomeData {
  month: string;
  amount: number;
  count: number;
}

interface PurchaseData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  plan: string;
  customerId: string | null;
  userId: string | null;
}

// Simple in-memory cache for income data (refreshes every 5 minutes)
// Cache version - increment to force refresh after code changes
const CACHE_VERSION = 2;
let incomeCache: { data: any; timestamp: number; version: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
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

      // Check cache first (also check version to invalidate after code changes)
      if (incomeCache && incomeCache.version === CACHE_VERSION && (Date.now() - incomeCache.timestamp) < CACHE_TTL) {
        return NextResponse.json(incomeCache.data);
      }
      
      const monthlyIncome: Record<string, MonthlyIncomeData> = {};
      const purchaseHistory: PurchaseData[] = [];
      
      // Only fetch data from the last 12 months to limit API calls
      const twelveMonthsAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
      
      try {
        // Fetch checkout sessions (one-time payments) - limited to last 12 months
        // Use parallel fetching - fetch ALL data within the date range
        const [checkoutSessions, invoices] = await Promise.all([
          // Fetch all checkout sessions from last 12 months (no item limit, date filter handles it)
          fetchCheckoutSessionsLimited(stripe, twelveMonthsAgo, 10000),
          // Fetch all invoices from last 12 months (no item limit, date filter handles it)
          fetchInvoicesLimited(stripe, twelveMonthsAgo, 10000)
        ]);

        // Process checkout sessions
        for (const session of checkoutSessions) {
          if (session.payment_status === 'paid') {
            const amount = (session.amount_total || 0) / 100;
            const currency = session.currency || 'usd';
            const createdAt = new Date(session.created * 1000);
            const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyIncome[monthKey]) {
              monthlyIncome[monthKey] = { month: monthKey, amount: 0, count: 0 };
            }
            monthlyIncome[monthKey].amount += amount;
            monthlyIncome[monthKey].count += 1;
            
            purchaseHistory.push({
              id: session.id,
              amount,
              currency,
              date: createdAt.toISOString(),
              plan: session.metadata?.plan || 'unknown',
              customerId: session.customer as string,
              userId: session.metadata?.user_id as string
            });
          }
        }
        
        // Process invoices (skip DB lookup to avoid N+1 queries)
        for (const invoice of invoices) {
          const amount = (invoice.amount_paid || 0) / 100;
          const currency = invoice.currency || 'usd';
          const createdAt = new Date(invoice.created * 1000);
          const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyIncome[monthKey]) {
            monthlyIncome[monthKey] = { month: monthKey, amount: 0, count: 0 };
          }
          monthlyIncome[monthKey].amount += amount;
          monthlyIncome[monthKey].count += 1;
          
          purchaseHistory.push({
            id: invoice.id,
            amount,
            currency,
            date: createdAt.toISOString(),
            plan: invoice.lines.data[0]?.description || 'subscription',
            customerId: invoice.customer as string,
            userId: null // Skip DB lookup for performance
          });
        }
      } catch (error) {
        console.error('Error fetching data from Stripe:', error);
        return NextResponse.json({ error: 'Error fetching Stripe data' }, { status: 500 });
      }
      
      // Convert monthly income to array and sort by month
      const monthlyIncomeArray = Object.values(monthlyIncome).sort((a, b) => a.month.localeCompare(b.month));
      
      // Sort purchase history by date (newest first)
      purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const responseData = {
        monthlyIncome: monthlyIncomeArray,
        purchaseHistory: purchaseHistory.slice(0, 50)
      };

      // Cache the result
      incomeCache = { data: responseData, timestamp: Date.now(), version: CACHE_VERSION };
      
      return NextResponse.json(responseData);

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching income data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to fetch checkout sessions with a limit
async function fetchCheckoutSessionsLimited(
  stripeClient: Stripe, 
  createdAfter: number, 
  maxItems: number
): Promise<Stripe.Checkout.Session[]> {
  const sessions: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;
  
  while (sessions.length < maxItems) {
    const response = await stripeClient.checkout.sessions.list({
      limit: 100,
      starting_after: startingAfter,
      status: 'complete',
      created: { gte: createdAfter }
    });
    
    sessions.push(...response.data);
    
    if (!response.has_more || response.data.length === 0) break;
    startingAfter = response.data[response.data.length - 1].id;
  }
  
  return sessions.slice(0, maxItems);
}

// Helper to fetch invoices with a limit
async function fetchInvoicesLimited(
  stripeClient: Stripe, 
  createdAfter: number, 
  maxItems: number
): Promise<Stripe.Invoice[]> {
  const invoices: Stripe.Invoice[] = [];
  let startingAfter: string | undefined;
  
  while (invoices.length < maxItems) {
    const response = await stripeClient.invoices.list({
      limit: 100,
      starting_after: startingAfter,
      status: 'paid',
      created: { gte: createdAfter }
    });
    
    invoices.push(...response.data);
    
    if (!response.has_more || response.data.length === 0) break;
    startingAfter = response.data[response.data.length - 1].id;
  }
  
  return invoices.slice(0, maxItems);
} 