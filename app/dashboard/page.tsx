"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { getUserKeys, getUserDiscounts } from '@/lib/api';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import Link from 'next/link';
import {
  ChevronRightIcon,
  KeyIcon,
  GiftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const getPlanColorClass = (plan: string) => {
  switch (plan) {
    case 'free':
      return 'text-gray-400';
    case 'economy':
      return 'text-slate-400';
    case 'basic':
      return 'text-blue-400';
    case 'premium':
      return 'text-purple-400';
    case 'pro':
      return 'text-emerald-400';
    case 'ultra':
      return 'text-amber-400';
    case 'enterprise':
      return 'text-orange-400';
    default:
      return 'text-blue-400';
  }
};

export default function Dashboard() {
  const { currentUser, checkPlanExpiration } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPlanExpiredNotice, setShowPlanExpiredNotice] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{
    currentCredits: number;
    dailyLimit: number;
    creditsUsed: number;
    resetTime: string;
  } | null>(null);
  const [creditLoading, setCreditLoading] = useState(true);
  const [discountData, setDiscountData] = useState<any>(null);
  const [discountLoading, setDiscountLoading] = useState(true);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Plan credit mapping
  const getPlanCredits = (plan: string) => {
    const creditMapping = {
      'free': 150_000,
      'economy': 1_000_000,
      'basic': 2_500_000,
      'premium': 8_000_000,
      'pro': 12_500_000,
      'ultra': 20_000_000,
      'enterprise': 200_000_000,
    };
    return creditMapping[plan as keyof typeof creditMapping] || 150_000;
  };

  // Function to fetch credit information
  const fetchCreditInfo = async () => {
    try {
      setCreditLoading(true);
      const response = await fetch('/api/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCreditInfo(data);
      } else {
        // If API doesn't exist yet, use plan-based defaults
        if (currentUser) {
          const dailyLimit = getPlanCredits(currentUser.plan || 'free');
          setCreditInfo({
            currentCredits: dailyLimit,
            dailyLimit: dailyLimit,
            creditsUsed: 0,
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching credit info:', error);
      // Fallback to plan-based defaults
      if (currentUser) {
        const dailyLimit = getPlanCredits(currentUser.plan || 'free');
        setCreditInfo({
          currentCredits: dailyLimit,
          dailyLimit: dailyLimit,
          creditsUsed: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
    } finally {
      setCreditLoading(false);
    }
  };

  // Function to fetch discount information
  const fetchDiscountInfo = async () => {
    try {
      setDiscountLoading(true);
      const data = await getUserDiscounts();
      setDiscountData(data);
    } catch (error) {
      console.error('Error fetching discount info:', error);
      setDiscountData(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const keys = await getUserKeys();
        setKeyCount(keys ? keys.length : 0);
      } catch (error) {
        console.error('Error fetching keys', error);
      } finally {
        setLoading(false);
      }
    };

    const initPage = async () => {
      await fetchKeys();
      if (currentUser) {
        await fetchCreditInfo();
        await fetchDiscountInfo();
      }

      const wasExpired = await checkPlanExpiration();
      setShowPlanExpiredNotice(wasExpired);

      if (wasExpired) {
        setTimeout(() => {
          setShowPlanExpiredNotice(false);
        }, 10000);
      }
    };

    initPage();
  }, [checkPlanExpiration, currentUser]);

  // Countdown timer effect
  useEffect(() => {
    if (!discountData?.active_discounts?.[0]?.time_remaining) return;

    const updateCountdown = () => {
      const discount = discountData.active_discounts[0];
      const expiresAt = new Date(discount.expires_at);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        // Refresh discount data when it expires
        fetchDiscountInfo();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [discountData]);

  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (timestamp?: string | null) => {
    if (!timestamp) return null;

    const expirationDate = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining(currentUser?.plan_expires_at);
  const planColorClass = getPlanColorClass(currentUser?.plan || 'free');

  const formatNumber = (num: number | string) => {
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    // Check if it's a valid number
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0';
    }
    
    // Format the number with commas
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getCreditPercentage = () => {
    if (!creditInfo) return 0;
    return (creditInfo.currentCredits / creditInfo.dailyLimit) * 100;
  };

  const getTimeUntilReset = () => {
    if (!creditInfo) return '';
    const resetTime = new Date(creditInfo.resetTime);
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {showPlanExpiredNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="modern-card p-6 border-red-500/20 bg-gradient-to-r from-red-500/08 to-red-600/04 flex items-center gap-4"
          >
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-3 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-red-400">Plan Expired</h3>
              <p className="text-sm text-white/75 mt-1">
                Your premium plan has expired. Your account has been downgraded to the free tier,
                and your API keys have been removed for security purposes.
              </p>
            </div>
          </motion.div>
        )}

        {/* Welcome Section */}
        <div className="modern-card p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, {currentUser?.username}
            </h1>
            <p className="text-white/75 text-lg">
              Manage your API keys and subscription with style
            </p>
          </motion.div>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="modern-card p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-3 rounded-full">
                  <StarIcon className={`w-6 h-6 ${planColorClass} drop-shadow-sm`} />
                </div>
                <h2 className="text-2xl font-semibold text-white">
                  Current Plan: <span className={`capitalize ${planColorClass} drop-shadow-sm`}>{currentUser?.plan}</span>
                </h2>
              </div>
              <div className="flex items-center text-white/75">
                <ClockIcon className="h-5 w-5 mr-2" />
                {currentUser?.plan_expires_at ? (
                  <span>
                    Expires on {formatDate(currentUser.plan_expires_at)}
                    {daysRemaining !== null && daysRemaining < 30 && (
                      <span className="ml-2 text-amber-400 font-medium">({daysRemaining} days remaining)</span>
                    )}
                  </span>
                ) : (
                  <span>Never expires</span>
                )}
              </div>
            </div>

            {currentUser?.plan === 'free' && (
              <Link href="/dashboard/billing">
                <ShimmerButton className="whitespace-nowrap bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg">
                  Upgrade Now
                </ShimmerButton>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Daily Credits Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="modern-card p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-3 rounded-full">
                <BanknotesIcon className="h-6 w-6 text-emerald-400 drop-shadow-sm" />
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Daily Credits
              </h2>
            </div>
            <Link
              href="/dashboard/usage"
              className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-all duration-300"
            >
              View Details <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {creditLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-md border border-white/06 h-8 rounded-lg w-1/3"></div>
                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-md border border-white/06 h-5 rounded-lg w-1/2"></div>
                <div className="bg-white/[0.02] backdrop-blur-sm border border-white/05 rounded-full h-3 rounded-full w-full"></div>
              </div>
            </div>
          ) : creditInfo ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-emerald-400 drop-shadow-sm text-white">
                    {formatNumber(creditInfo.currentCredits)}
                  </span>
                  <span className="text-white/75 text-lg">
                    / {formatNumber(creditInfo.dailyLimit)} credits
                  </span>
                </div>
                <p className="text-white/75">
                  Resets in {getTimeUntilReset()} • {formatNumber(creditInfo.creditsUsed)} used today
                </p>
              </div>
              
              {/* Enhanced Credit Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/75">Usage Progress</span>
                  <span className="text-sm text-white/75">{Math.round(getCreditPercentage())}%</span>
                </div>
                <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/40 rounded-full h-4 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-full transition-all duration-700 ease-out relative shadow-sm shadow-emerald-500/30"
                    style={{ width: `${getCreditPercentage()}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-4 rounded-lg">
              <p className="text-white/75 text-center">Unable to load credit information</p>
            </div>
          )}
        </motion.div>

        {/* Daily Discount Card */}
        {!discountLoading && discountData?.has_discount && discountData.active_discounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="modern-card p-6"
          >
            {discountData.active_discounts.map((discount: any) => (
              <div key={discount.model_id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-3 rounded-full">
                      <SparklesIcon className="h-6 w-6 text-amber-400 drop-shadow-sm" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Today's Discount</h2>
                      <p className="text-white/60 text-sm">
                        {countdown.hours}h {countdown.minutes}m {countdown.seconds}s remaining
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400 drop-shadow-sm">
                      {discount.discount.savings_percent}
                    </div>
                    <div className="text-xs text-white/60">OFF</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 rounded-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {discount.model_name}
                    </h3>
                    <p className="text-white/60 text-sm">by {discount.model_owner}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white/40 line-through text-sm">
                      {Math.round(discount.pricing.cost_per_1k_tokens.original)} credits
                    </div>
                    <div className="text-amber-400 text-xl font-bold">
                      {Math.round(discount.pricing.cost_per_1k_tokens.discounted)} credits
                    </div>
                    <div className="text-white/60 text-xs">per 1k tokens</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* API Keys Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="modern-card p-8 group"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <KeyIcon className="w-8 h-8 text-blue-400 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">API Keys</h3>
                  <p className="text-white/75 mt-1">
                    {loading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `You have ${keyCount} active API key${keyCount !== 1 ? 's' : ''}`
                    )}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/dashboard/keys"
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-all duration-300"
                >
                  Manage Keys <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Redeem Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="modern-card p-8 group"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <GiftIcon className="w-8 h-8 text-amber-400 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Redeem Code</h3>
                  <p className="text-white/75 mt-1">
                    Use a redeem code to upgrade your plan
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/dashboard/redeem"
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 transition-all duration-300"
                >
                  Redeem Now <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Guide Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="modern-card p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-3 rounded-full">
              <QuestionMarkCircleIcon className="h-6 w-6 text-purple-400 drop-shadow-sm" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Quick Guide</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Getting Started */}
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-6 rounded-2xl space-y-6">
              <h3 className="text-xl font-medium text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Getting Started
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-center w-8 h-8 rounded-full text-blue-400 text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <span className="text-white/75">
                    Generate an API key in the{' '}
                    <Link href="/dashboard/keys" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline decoration-blue-400/30">
                      Keys section
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-center w-8 h-8 rounded-full text-blue-400 text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <span className="text-white/75">
                    Use your API key in your application's authorization header
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-center w-8 h-8 rounded-full text-blue-400 text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <span className="text-white/75">
                    Manage your keys and usage from this dashboard
                  </span>
                </li>
              </ul>
            </div>

            {/* Need Help */}
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 p-6 rounded-2xl space-y-6">
              <h3 className="text-xl font-medium text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Need Help?
              </h3>
              <p className="text-white/75">
                Check out our documentation or join our Discord community for support:
              </p>
              <div className="space-y-3">
                <a
                  href="https://docs.voidai.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-all duration-300"
                >
                  View API documentation <ChevronRightIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://discord.gg/pQab7kukfu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-400 hover:text-purple-300 transition-all duration-300"
                >
                  Join our Discord <ChevronRightIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}