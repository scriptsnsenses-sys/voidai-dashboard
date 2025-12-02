"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { PLAN_DETAILS, STRIPE_PUBLIC_KEY } from '@/lib/stripe-client';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import RPModelsVerification from '@/components/billing/RPModelsVerification';
import { loadStripe } from '@stripe/stripe-js';
import {
  CreditCardIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);


export default function BillingPage() {
  const { currentUser, getUserInfo } = useAuth();
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isUpgradeNeeded, setIsUpgradeNeeded] = useState(false);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [rpVerificationLoading, setRpVerificationLoading] = useState(false);
  const [rpVerificationError, setRpVerificationError] = useState('');
  const [rpVerificationSuccess, setRpVerificationSuccess] = useState(false);

  useEffect(() => {
    // Check for RP verification success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const rpSuccess = urlParams.get('rp_success');
    const type = urlParams.get('type');
    
    if (rpSuccess === 'true' && type === 'rp_verification') {
      setRpVerificationSuccess(true);
      // Refresh user info to get updated verification status
      getUserInfo();
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard/billing');
    }

    if (currentUser?.plan_expires_at) {
      const expiryDate = new Date(parseInt(currentUser.plan_expires_at) * 1000);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setRemainingDays(diffDays > 0 ? diffDays : 0);

      setIsUpgradeNeeded(diffDays < 7 || currentUser.plan === 'free');
    } else if (currentUser?.plan === 'free') {
      setIsUpgradeNeeded(true);
    }
  }, [currentUser, getUserInfo]);

  const handlePlanSelect = async (plan: string) => {
    setSelectedPlan(plan);

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingType,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        throw new Error('Failed to initialize Stripe');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return 'Never expires';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleCancelSubscription = async () => {
    if (!currentUser?.subscription_id) return;

    try {
      setCancellationLoading(true);
      setError('');

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      setCancellationSuccess(true);

      await getUserInfo();

    } catch (err: any) {
      setError(err.message || 'Error canceling subscription');
    } finally {
      setCancellationLoading(false);
    }
  };

  const handleRPVerification = async () => {
    try {
      setRpVerificationLoading(true);
      setRpVerificationError('');

      const response = await fetch('/api/rp-verification/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        throw new Error('Failed to initialize Stripe');
      }
    } catch (err: any) {
      console.error('Error creating RP verification checkout:', err);
      setRpVerificationError(err.message || 'Failed to process verification payment. Please try again.');
    } finally {
      setRpVerificationLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Your Subscription</h1>
          <p className="text-muted-foreground mt-1">
            View and upgrade your plan to get higher API rate limits
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {cancellationSuccess && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center">
            <CheckIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            Your subscription has been canceled and will end at the current billing period.
          </div>
        )}

        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-950/20 to-black/20 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <CreditCardIcon className="w-5 h-5 mr-2 text-blue-400" />
                Current Plan: <span className="ml-2 capitalize text-blue-400">{currentUser?.plan}</span>
              </h2>

              {currentUser?.plan_expires_at && (
                <div className="mt-2 flex items-center text-muted-foreground">
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  <span>
                    Expires on {formatDate(currentUser.plan_expires_at)}
                    {remainingDays !== null && remainingDays < 30 && (
                      <span className={`ml-2 ${remainingDays < 7 ? 'text-red-400' : 'text-amber-400'}`}>
                        ({remainingDays} days remaining)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {currentUser?.cancel_at_period_end && (
                <div className="mt-2 text-amber-400 text-sm">
                  Your subscription has been canceled and will end at the current billing period.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {isUpgradeNeeded && (
                <div className={`${remainingDays !== null && remainingDays < 7 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'} p-3 rounded-lg border text-sm`}>
                  {remainingDays !== null && remainingDays < 7 ? (
                    <p className="text-red-400">
                      <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                      Your subscription will expire soon. Upgrade now to maintain your API access.
                    </p>
                  ) : (
                    <p className="text-amber-400">
                      Upgrade to a higher plan to get increased rate limits and additional features.
                    </p>
                  )}
                </div>
              )}

              {currentUser?.subscription_id && !currentUser?.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancellationLoading}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                >
                  {cancellationLoading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>

        {rpVerificationSuccess && currentUser?.rp_verified && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center"
          >
            <CheckIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <strong>RP Models Verification Successful!</strong>
              <p className="text-sm mt-1">You now have access to Deepseek and Gemini RP models with 50k bonus tokens for 30 days.</p>
            </div>
          </motion.div>
        )}

        {/* RP Models Verification Section */}
        {currentUser && (
          <RPModelsVerification
            currentUser={currentUser}
            onVerify={handleRPVerification}
            loading={rpVerificationLoading}
            error={rpVerificationError}
          />
        )}

        <div className="flex flex-col items-center justify-center mb-8">
          <h2 className="text-lg font-medium mb-4">Select Billing Type</h2>
          <div className="inline-flex rounded-lg bg-neutral-800/50 p-1">
            <button
              onClick={() => setBillingType('monthly')}
              className={`px-6 py-2 rounded-lg ${
                billingType === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingType('yearly')}
              className={`px-6 py-2 rounded-lg ${
                billingType === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
          <p className="mt-2 text-xs text-white/60">
            {billingType === 'monthly' ? 'Monthly plans renew automatically every month.' : 'Annual plan, billed once.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-xl border ${currentUser?.plan === 'economy' ? 'border-gray-500/30' : 'border-white/10'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'economy' && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-400">Economy</h3>
              <p className="mt-1 text-white/70">Entry-level access for small projects</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.economy.monthlyPrice : PLAN_DETAILS.economy.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>650,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Higher rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Claude Haiku models</span>
              </li>
              <li className="flex items-start">
                <XMarkIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>No Claude Opus or Sonnet</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Basic Support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('economy')}
              disabled={loading || currentUser?.plan === 'economy'}
              className={`w-full ${currentUser?.plan === 'economy' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-gray-600/20'}`}
              variant={currentUser?.plan !== 'economy' ? 'default' : undefined}
            >
              {loading && selectedPlan === 'economy' ? 'Processing...' : 
               currentUser?.plan === 'economy' ? 'Current Plan' : 'Select Economy'}
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`rounded-xl border ${currentUser?.plan === 'basic' ? 'border-blue-500/30' : 'border-white/10'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'basic' && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-400">Basic</h3>
              <p className="mt-1 text-white/70">For small apps and personal projects</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.basic.monthlyPrice : PLAN_DETAILS.basic.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>1,000,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Enhanced rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>OpenAI reasoning mini models</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Gemini 2.5 Pro</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Claude Sonnet & Haiku models</span>
              </li>
              <li className="flex items-start">
                <XMarkIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>No Claude Opus</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Priority Support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('basic')}
              disabled={loading || currentUser?.plan === 'basic'}
              className={`w-full ${currentUser?.plan === 'basic' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-blue-600/20'}`}
            >
              {loading && selectedPlan === 'basic' ? 'Processing...' : 
               currentUser?.plan === 'basic' ? 'Current Plan' : 'Select Basic'}
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl border ${currentUser?.plan === 'premium' ? 'border-purple-500/30' : 'border-purple-500/20'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'premium' ? (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            ) : (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">Popular</span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-purple-400">Premium</h3>
              <p className="mt-1 text-white/70">For growing applications and businesses</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.premium.monthlyPrice : PLAN_DETAILS.premium.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>4,250,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Premium rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All OpenAI reasoning models</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Claude Sonnet & Haiku models</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Claude Opus models</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Priority Support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('premium')}
              disabled={loading || currentUser?.plan === 'premium'}
              className={`w-full ${currentUser?.plan === 'premium' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-purple-600/20'}`}
            >
              {loading && selectedPlan === 'premium' ? 'Processing...' : 
               currentUser?.plan === 'premium' ? 'Current Plan' : 'Select Premium'}
            </ShimmerButton>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`rounded-xl border ${currentUser?.plan === 'pro' ? 'border-emerald-500/30' : 'border-emerald-500/20'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'pro' && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-emerald-400">Pro</h3>
              <p className="mt-1 text-white/70">For professional applications</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.pro.monthlyPrice : PLAN_DETAILS.pro.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>8,500,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Professional rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Every OpenAI/Anthropic model</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Future model guarantee</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All Claude models (including Opus)</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Priority Support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('pro')}
              disabled={loading || currentUser?.plan === 'pro'}
              className={`w-full ${currentUser?.plan === 'pro' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-emerald-600/20'}`}
              variant={currentUser?.plan !== 'pro' ? 'default' : undefined}
            >
              {loading && selectedPlan === 'pro' ? 'Processing...' : 
               currentUser?.plan === 'pro' ? 'Current Plan' : 'Select Pro'}
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl border ${currentUser?.plan === 'ultra' ? 'border-amber-500/30' : 'border-amber-500/20'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'ultra' && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-amber-400">Ultra</h3>
              <p className="mt-1 text-white/70">For high-demand applications</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.ultra.monthlyPrice : PLAN_DETAILS.ultra.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>12,500,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Ultra-high rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All Claude models (including Opus)</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Midjourney image generation</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All models included</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Premium Support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('ultra')}
              disabled={loading || currentUser?.plan === 'ultra'}
              className={`w-full ${currentUser?.plan === 'ultra' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-amber-600/20'}`}
            >
              {loading && selectedPlan === 'ultra' ? 'Processing...' : 
               currentUser?.plan === 'ultra' ? 'Current Plan' : 'Select Ultra'}
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`rounded-xl border ${currentUser?.plan === 'enterprise' ? 'border-red-500/30' : 'border-red-500/20'} bg-neutral-900/50 p-6 backdrop-blur-sm flex flex-col h-full relative`}
          >
            {currentUser?.plan === 'enterprise' && (
              <div className="absolute top-0 right-0 mt-6 mr-6">
                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">Current Plan</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-red-400">Enterprise</h3>
              <p className="mt-1 text-white/70">For high-volume production applications</p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold">
                ${billingType === 'monthly' ? PLAN_DETAILS.enterprise.monthlyPrice : PLAN_DETAILS.enterprise.yearlyPrice}
                <span className="text-lg font-normal text-white/60 ml-1">
                  {billingType === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>80,000,000 Tokens per Day</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Enterprise rate limits</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All Claude models (including Opus)</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Midjourney image generation</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>All models included</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>Dedicated support</span>
              </li>
            </ul>

            <ShimmerButton
              onClick={() => handlePlanSelect('enterprise')}
              disabled={loading || currentUser?.plan === 'enterprise'}
              className={`w-full mt-auto ${currentUser?.plan === 'enterprise' ? 'bg-neutral-600/20 cursor-not-allowed' : 'bg-red-600/20'}`}
            >
              {loading && selectedPlan === 'enterprise' ? 'Processing...' : 
               currentUser?.plan === 'enterprise' ? 'Current Plan' : 'Select Enterprise'}
            </ShimmerButton>
          </motion.div>
        </div>


        <div className="mt-16 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">What happens to my token limits after upgrading?</h3>
              <p className="text-white/70">
                Your daily token limits are updated immediately after your purchase is processed. All existing API keys will have the new limits applied automatically.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">What's the difference between monthly and yearly?</h3>
              <p className="text-white/70">
                Monthly plans are subscription-based and will renew automatically each month. Yearly plans are also subscription-based and will renew automatically each year.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Can I upgrade from a lower plan to a higher plan?</h3>
              <p className="text-white/70">
                Yes, you can upgrade at any time. If you're on a monthly subscription, we'll prorate the cost based on the time remaining in your current billing cycle.
              </p>
            </div>


            <div>
              <h3 className="text-lg font-medium mb-2">How can I cancel my subscription?</h3>
              <p className="text-white/70">
                You can cancel your subscription at any time by clicking the 'Cancel Subscription' button on this page. Your subscription will remain active until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}