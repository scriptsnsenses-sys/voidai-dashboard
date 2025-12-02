"use client";

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { useAuth } from '@/lib/auth';
import { redeemCode } from '@/lib/api';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

type RedeemData = {
  plan: string;
  plan_expires_at: string;
};

export default function Redeem() {
  const { currentUser, getUserInfo } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redeemInfo, setRedeemInfo] = useState<RedeemData | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const hcaptchaRef = useRef<HCaptcha>(null);

  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '09488f44-c57e-45f0-ad28-c17867788dc6';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code) {
      setError('Please enter a redeem code');
      return;
    }

    if (!hcaptchaToken) {
      setError('Please complete the security check');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await redeemCode(code, hcaptchaToken);

      if (response.success) {
        setSuccess(true);
        setRedeemInfo(response.data);

        await getUserInfo();
      } else {
        setError(response.message || 'Failed to redeem code');
      }
    } catch (err: any) {
      console.error('Error redeeming code:', err);
      setError(err.message || 'Failed to redeem code');
      setHcaptchaToken(null);
      if (hcaptchaRef.current) {
        hcaptchaRef.current.resetCaptcha();
      }
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Redeem Code</h1>
          <p className="text-muted-foreground mt-1">
            Use a redeem code to upgrade your account
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-500/20 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-400">
                Code Redeemed Successfully!
              </h2>
            </div>

            <div className="px-4 py-6 rounded-lg bg-black/20 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Plan Upgraded To</p>
                  <p className="text-lg font-semibold mt-1 capitalize">
                    {redeemInfo?.plan || 'Unknown'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/60">Expires On</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(redeemInfo?.plan_expires_at)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-white/70">
              Your account has been upgraded successfully. You now have access to all the features 
              of the {redeemInfo?.plan} plan.
            </p>

            <ShimmerButton
              onClick={() => {
                setSuccess(false);
                setCode('');
                setRedeemInfo(null);
              }}
              className="mt-6"
            >
              Redeem Another Code
            </ShimmerButton>
          </motion.div>
        ) : (
          <>
            {}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/10">
              <h2 className="text-lg font-medium mb-4">Current Plan Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-sm text-white/60">Current Plan</p>
                  <p className="text-lg font-semibold mt-1 capitalize">
                    {currentUser?.plan || 'Free'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-white/60">Expires On</p>
                  <p className="text-lg font-semibold mt-1">
                    {currentUser?.plan_expires_at 
                      ? formatDate(currentUser.plan_expires_at)
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="mt-8">
              <div className="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="code" className="block text-sm font-medium mb-2">
                      Enter Redeem Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                      placeholder="e.g. REDEEM-CODE-xxxxx"
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Enter your redeem code to upgrade your account
                    </p>
                  </div>

                  <div className="flex justify-center my-6">
                    <HCaptcha
                      ref={hcaptchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={setHcaptchaToken}
                      theme="dark"
                    />
                  </div>

                  <div>
                    <ShimmerButton
                      type="submit"
                      disabled={loading || !code || !hcaptchaToken}
                      className="flex items-center"
                    >
                      {loading ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2 animate-spin">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                          </svg>
                          Redeem Code
                        </>
                      )}
                    </ShimmerButton>
                  </div>
                </form>
              </div>
            </div>

            {}
            <div className="mt-12 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
              <h2 className="text-lg font-medium flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2 text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                About Redeem Codes
              </h2>

              <p className="text-white/70 mb-4">
                Redeem codes can be used to upgrade your account to a higher plan. 
                Each code can only be used once and is linked to a specific plan.
              </p>

              <p className="text-white/70">
                If you have any issues with redeeming your code, please contact our support.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}