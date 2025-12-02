import 'server-only';
import { Stripe } from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('ERROR: Missing Stripe secret key. Please set STRIPE_SECRET_KEY in environment variables.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia', 
  typescript: true,
  appInfo: {
    name: 'VoidAI',
    version: '1.0.0',
  },
});

export const STRIPE_PLANS = {
  ECONOMY_MONTHLY: 'price_1RXqMXHHrax5hT3akUcuG7Sq',
  ECONOMY_YEARLY: 'price_1RXqMvHHrax5hT3aDyrZhVdR',
  BASIC_MONTHLY: 'price_1RXqNlHHrax5hT3ahySAr3tu',
  PREMIUM_MONTHLY: 'price_1RXqOeHHrax5hT3aPHVZHBTL',
  PRO_MONTHLY: 'price_1SDaqAHHrax5hT3aoldptFkp',
  ULTRA_MONTHLY: 'price_1RXqc2HHrax5hT3abw9YgHPD',
  BASIC_YEARLY: 'price_1RXqO4HHrax5hT3a97XYxEOB',
  PREMIUM_YEARLY: 'price_1RXqP1HHrax5hT3aZWgtljYf',
  PRO_YEARLY: 'price_1RXqPuHHrax5hT3a1DEvNo8N',
  ULTRA_YEARLY: 'price_1Rf3sxHHrax5hT3asiK5XP3a',
  ENTERPRISE_MONTHLY: 'price_1SC7YOHHrax5hT3aCOtD9zGk',
  ENTERPRISE_YEARLY: 'price_1SC7YkHHrax5hT3a6oFc6lcB',
};

type PlanDetail = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  rpm: number | null;
  rpd: number | null;
};

export const PLAN_DETAILS: Record<string, PlanDetail> = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    rpm: 5,
    rpd: 50,
  },
  economy: {
    name: 'Economy',
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    rpm: 10,
    rpd: 750,
  },
  basic: {
    name: 'Basic',
    monthlyPrice: 7.99,
    yearlyPrice: 59.99,
    rpm: 10,
    rpd: 2000,
  },
  premium: {
    name: 'Premium',
    monthlyPrice: 29.99,
    yearlyPrice: 99.99,
    rpm: 35,
    rpd: 5000,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 42.99,
    yearlyPrice: 299.99,
    rpm: 75,
    rpd: 7500,
  },
  ultra: {
    name: 'Ultra',
    monthlyPrice: 69.99,
    yearlyPrice: 449.99,
    rpm: 100,
    rpd: 10000,
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 249.99,
    yearlyPrice: 2099.99,
    rpm: null, // Unlimited
    rpd: null, // Unlimited
  },
};

export const CUSTOM_PRICING = {
  rpmRate: 0.65,
  rpdRate: 0.0055,
  rpmRateYearly: 6.5,
  rpdRateYearly: 0.055,
};

export function calculateCustomPlanPrice(rpm: number, rpd: number, isYearly: boolean = false): number {
  if (isYearly) {
    const price = (rpm * CUSTOM_PRICING.rpmRateYearly) + (rpd * CUSTOM_PRICING.rpdRateYearly);
    return Math.max(price, 39.99);
  } else {
    const price = (rpm * CUSTOM_PRICING.rpmRate) + (rpd * CUSTOM_PRICING.rpdRate);
    return Math.max(price, 4.99);
  }
}

export async function createCustomPlanProduct(
  name: string, 
  rpm: number, 
  rpd: number, 
  isYearly: boolean = false
): Promise<string> {
  try {

    const product = await stripe.products.create({
      name: `Custom Plan - ${name}`,
      description: `Custom plan with ${rpm} RPM and ${rpd} RPD`,
      metadata: {
        type: 'custom',
        rpm: rpm.toString(),
        rpd: rpd.toString(),
      },
    });

    const price = calculateCustomPlanPrice(rpm, rpd, isYearly);
    const priceCents = Math.round(price * 100);

    let stripePrice;
    if (isYearly) {
      stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: 'usd',
      });
    } else {
      stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
    }

    return stripePrice.id;
  } catch (error) {
    console.error('Error creating custom plan product:', error);
    throw error;
  }
}

export async function getOrCreateCustomer(email: string, metadata: Record<string, string> = {}): Promise<string> {
  try {
    // First, try to find a customer with matching email AND user_id metadata
    const userId = metadata.user_id;
    if (userId) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 100, // Get more results to find the right customer
      });

      // Look for a customer with matching user_id in metadata
      const matchingCustomer = existingCustomers.data.find(customer =>
        customer.metadata?.user_id === userId
      );

      if (matchingCustomer) {
        // Update metadata and return existing customer
        await stripe.customers.update(matchingCustomer.id, { metadata });
        return matchingCustomer.id;
      }
    }

    // If no matching customer found, search by email only (fallback)
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      const customer = customers.data[0];
      // Only use this customer if it doesn't have a conflicting user_id
      if (!customer.metadata?.user_id || customer.metadata.user_id === userId) {
        await stripe.customers.update(customer.id, { metadata });
        return customer.id;
      }
    }

    // Create new customer if no suitable existing customer found
    const customer = await stripe.customers.create({
      email,
      metadata,
    });

    return customer.id;
  } catch (error) {
    console.error('Error getting or creating customer:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription.cancel_at_period_end === true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export default stripe;