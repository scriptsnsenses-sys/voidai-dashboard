export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export const STRIPE_PLANS = {
  ECONOMY_MONTHLY: 'price_1RXqMXHHrax5hT3akUcuG7Sq',
  ECONOMY_YEARLY: 'price_1RXqMvHHrax5hT3aDyrZhVdR',
  BASIC_MONTHLY: 'price_1RXqNlHHrax5hT3ahySAr3tu',
  PREMIUM_MONTHLY: 'price_1RXqOeHHrax5hT3aPHVZHBTL',
  PRO_MONTHLY: 'price_1RXqPXHHrax5hT3aLZHfZKHM',
  ULTRA_MONTHLY: 'price_1R1pO4HHrax5hT3ai43EjDR9',
  BASIC_YEARLY: 'price_1RXqO4HHrax5hT3a97XYxEOB',
  PREMIUM_YEARLY: 'price_1RXqP1HHrax5hT3aZWgtljYf',
  PRO_YEARLY: 'price_1RXqPuHHrax5hT3a1DEvNo8N',
  ULTRA_YEARLY: 'price_1RIS2kHHrax5hT3auBDmSELs',
  ENTERPRISE_MONTHLY: 'price_1R9VxTHHrax5hT3as4mX5dTK',
  ENTERPRISE_YEARLY: 'price_1RIS0EHHrax5hT3afCBtBzSZ',
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