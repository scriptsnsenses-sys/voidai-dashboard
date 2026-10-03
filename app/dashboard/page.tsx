"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { getUserKeys } from '@/lib/api';
import Link from 'next/link';
import {
  ChevronRightIcon,
  KeyIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [keyCount, setKeyCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

    fetchKeys();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
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
              Your account is free forever, with no credits or paid plans.
            </p>
          </motion.div>
        </div>

        {/* Free access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="modern-card flex items-center justify-between gap-4 p-6"
        >
          <div>
            <h2 className="text-xl font-semibold text-white">Free forever</h2>
            <p className="mt-1 text-sm text-white/70">No billing, subscriptions, or upgrades.</p>
          </div>
          <Link href="/dashboard/billing" className="text-sm text-emerald-400 hover:text-emerald-300">
            Free access details <ChevronRightIcon className="inline h-4 w-4" />
          </Link>
        </motion.div>

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

          {/* Usage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="modern-card p-8 group"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="w-8 h-8 text-emerald-400 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Usage history</h3>
                  <p className="text-white/75 mt-1">
                    Review API request activity over time
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/dashboard/usage"
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 hover:border-white/12 rounded-lg inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-all duration-300"
                >
                  View activity <ChevronRightIcon className="h-4 w-4" />
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