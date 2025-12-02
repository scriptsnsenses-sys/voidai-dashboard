"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import RPPaymentModal from './RPPaymentModal';
import { User } from '@/lib/auth';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RPModelsVerificationProps {
  currentUser: User;
  onVerify: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function RPModelsVerification({ 
  currentUser, 
  onVerify, 
  loading = false, 
  error 
}: RPModelsVerificationProps) {
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Only show for free users
  if (currentUser?.plan !== 'free') {
    return null;
  }

  const isVerified = currentUser?.rp_verified || false;
  const bonusTokensExpired = currentUser?.rp_bonus_tokens_expires ? 
    new Date(parseInt(currentUser.rp_bonus_tokens_expires) * 1000) < new Date() : false;

  const faqData = [
    {
      question: "How much will it cost?",
      answer: "$2.50 - One time payment"
    },
    {
      question: "Is it going to be a one time payment?",
      answer: "Yes, this is a one-time verification fee."
    },
    {
      question: "How does the $2.50 discount work?",
      answer: "You can choose any plan and you will receive a $2.50 discount on that plan. (one-time use, so you have to choose wisely on which plan you want)"
    },
    {
      question: "How many tokens will I receive in the credit benefit?",
      answer: "You will receive 50k additional tokens for free for a period of 30 days. After that it will return back to normal and you will keep your discount if it is not used and access to RP models."
    },
    {
      question: "How long is the credit benefit?",
      answer: "1 month, after the 1 month it will revert back to normal"
    },
    {
      question: "Can we use the RP Models forever after verifying?",
      answer: "Yes, once verified you have permanent access to RP models."
    },
    {
      question: "What if I cannot pay with my payment method?",
      answer: "We are working to add more payment methods."
    },
    {
      question: "Can we verify with PayPal?",
      answer: "Yes."
    },
    {
      question: "Can we verify with Crypto?",
      answer: "No, crypto payments are not supported for verification."
    },
    {
      question: "What is the reason for adding this verification?",
      answer: "We've experienced significant challenges with alternative account abuse and unsustainable costs from free RP usage. This verification helps us maintain service quality while allowing genuine users to access RP models. The small fee helps prevent abuse while keeping RP access available for those who value it."
    },
    {
      question: "What models will be available after verifying?",
      answer: "With the free plan after verifying you will have access to Deepseek and Gemini RP only"
    },
    {
      question: "When will this be added?",
      answer: "We don't know yet, more info soon"
    }
  ];

  const benefits = [
    {
      icon: SparklesIcon,
      title: "50k Bonus Tokens",
      description: "Free for 30 days",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      icon: CurrencyDollarIcon,
      title: "$2.50 Discount",
      description: "On any plan upgrade",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      icon: ShieldCheckIcon,
      title: "Permanent RP Access",
      description: "Deepseek & Gemini RP",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-950/20 via-pink-950/10 to-blue-950/20 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {isVerified ? (
              <ShieldCheckIcon className="w-6 h-6 text-green-400 mr-3" />
            ) : (
              <ShieldExclamationIcon className="w-6 h-6 text-purple-400 mr-3" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                RP Models Verification
              </h2>
              <p className="text-sm text-white/70 mt-1">
                {isVerified 
                  ? "You have access to RP models" 
                  : "Unlock access to roleplay models"
                }
              </p>
            </div>
          </div>
          
          {isVerified && (
            <div className="flex items-center px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <CheckIcon className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-sm text-green-400 font-medium">Verified</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {isVerified ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                const isTokenBenefit = benefit.title.includes('Bonus Tokens');
                const isExpired = isTokenBenefit && bonusTokensExpired;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${benefit.borderColor} ${benefit.bgColor} ${
                      isExpired ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className={`w-5 h-5 ${benefit.color} mr-2`} />
                      <span className="font-medium text-white">{benefit.title}</span>
                      {isExpired && (
                        <span className="ml-2 text-xs text-amber-400">(Expired)</span>
                      )}
                    </div>
                    <p className="text-sm text-white/70">{benefit.description}</p>
                    {isTokenBenefit && currentUser?.rp_bonus_tokens_expires && !isExpired && (
                      <div className="mt-2 flex items-center text-xs text-white/60">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Expires: {new Date(parseInt(currentUser.rp_bonus_tokens_expires) * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-200">
                <CheckIcon className="w-4 h-4 inline mr-1" />
                You now have permanent access to <strong>Deepseek</strong> and <strong>Gemini RP</strong> models!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${benefit.borderColor} ${benefit.bgColor}`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className={`w-5 h-5 ${benefit.color} mr-2`} />
                      <span className="font-medium text-white">{benefit.title}</span>
                    </div>
                    <p className="text-sm text-white/70">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
              <div className="text-center sm:text-left">
                <p className="text-3xl font-bold text-white">$2.50</p>
                <p className="text-sm text-white/70">One-time verification fee</p>
              </div>
              
              <ShimmerButton
                onClick={onVerify}
                disabled={loading}
                variant="gradient"
                className="px-8 py-3 text-lg font-medium rounded-full min-w-[200px] bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Verify for $2.50'}
              </ShimmerButton>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400 mr-2" />
              <span className="font-medium text-white">Frequently Asked Questions</span>
            </div>
            {showFAQ ? (
              <ChevronUpIcon className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-white/60" />
            )}
          </button>

          <AnimatePresence mode="wait">
            {showFAQ && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {faqData.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full p-4 text-left hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white text-sm pr-4">{faq.question}</span>
                        <motion.div
                          animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDownIcon className="w-4 h-4 text-white/60 flex-shrink-0" />
                        </motion.div>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedFAQ === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-sm text-white/70 leading-relaxed">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
}