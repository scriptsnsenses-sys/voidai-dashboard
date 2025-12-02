"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getUserInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const isRPVerification = type === 'rp_verification';

  useEffect(() => {
    const handleSuccess = async () => {
      if (!sessionId) {
        router.push('/dashboard/billing');
        return;
      }

      try {
        // Refresh user info to get updated verification status
        await getUserInfo();
        
        if (isRPVerification) {
          // For RP verification, we can show success immediately
          setVerificationData({
            type: 'rp_verification',
            bonusTokens: '50,000',
            bonusDuration: '30 days',
            discount: '$2.50',
            models: ['Deepseek RP', 'Gemini RP']
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error handling success:', error);
        setIsLoading(false);
      }
    };

    handleSuccess();
  }, [sessionId, isRPVerification, getUserInfo, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white/70">Processing your payment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isRPVerification && verificationData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full mb-6"
            >
              <CheckCircleIcon className="w-10 h-10 text-green-400" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              RP Models Verification Complete! 🎉
            </h1>
            <p className="text-xl text-white/70 mb-8">
              You now have access to roleplay models and exclusive benefits
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-gradient-to-br from-purple-950/20 to-pink-950/10 border border-purple-500/20"
            >
              <div className="flex items-center mb-4">
                <SparklesIcon className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Bonus Tokens</h3>
              </div>
              <p className="text-2xl font-bold text-purple-400 mb-2">{verificationData.bonusTokens}</p>
              <p className="text-sm text-white/70">Free for {verificationData.bonusDuration}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl bg-gradient-to-br from-green-950/20 to-emerald-950/10 border border-green-500/20"
            >
              <div className="flex items-center mb-4">
                <CurrencyDollarIcon className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Plan Discount</h3>
              </div>
              <p className="text-2xl font-bold text-green-400 mb-2">{verificationData.discount}</p>
              <p className="text-sm text-white/70">One-time use on any plan</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl bg-gradient-to-br from-blue-950/20 to-cyan-950/10 border border-blue-500/20"
            >
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">RP Access</h3>
              </div>
              <p className="text-lg font-bold text-blue-400 mb-2">Permanent</p>
              <p className="text-sm text-white/70">Deepseek & Gemini RP</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 border border-blue-500/20 mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">What's Next?</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-white/80">You can now access <strong>Deepseek RP</strong> and <strong>Gemini RP</strong> models</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-white/80">Your bonus tokens will be active for the next 30 days</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-white/80">Use your $2.50 discount when upgrading to any paid plan</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-white/80">RP model access is permanent - no expiration!</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <ShimmerButton
              onClick={() => router.push('/dashboard/models')}
              variant="gradient"
              className="px-8 py-3"
            >
              Explore RP Models
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </ShimmerButton>
            
            <ShimmerButton
              onClick={() => router.push('/dashboard/billing')}
              variant="default"
              className="px-8 py-3"
            >
              Back to Billing
            </ShimmerButton>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Default success page for regular plan purchases
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full mb-6"
          >
            <CheckCircleIcon className="w-10 h-10 text-green-400" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-white/70 mb-8">
            Your subscription has been activated and you now have access to enhanced features.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ShimmerButton
              onClick={() => router.push('/dashboard')}
              variant="gradient"
              className="px-8 py-3"
            >
              Go to Dashboard
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </ShimmerButton>
            
            <ShimmerButton
              onClick={() => router.push('/dashboard/billing')}
              variant="default"
              className="px-8 py-3"
            >
              View Billing
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}