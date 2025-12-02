"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import Link from 'next/link';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  CommandLineIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import IncomeChart from '@/components/admin/IncomeChart';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Dashboard <span className="text-white/40 font-normal">Overview</span>
          </h1>
          <p className="text-white/60 mt-2 text-lg">
            Welcome back, Administrator. Here's what's happening today.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="liquid-glass-card p-8 animate-pulse h-48">
                <div className="h-6 w-32 bg-white/5 rounded mb-6"></div>
                <div className="h-10 w-24 bg-white/5 rounded mb-8"></div>
                <div className="h-4 w-full bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="liquid-glass-card p-8 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Total Users</h2>
                  <p className="text-4xl font-bold mt-3 text-white group-hover:scale-105 transition-transform duration-300 origin-left">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <UsersIcon className="h-6 w-6" />
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px] text-white/40">
                      ?
                    </div>
                  ))}
                </div>
                <span className="text-white/60 text-sm font-medium">{stats.activeUsers} active users now</span>
              </div>
            </motion.div>

          </div>
        )}

        {/* Income Analytics Chart */}
        <div className="liquid-glass-enhanced p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Revenue Analytics</h3>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option>Last 30 Days</option>
                    <option>Last 6 Months</option>
                    <option>Year to Date</option>
                </select>
            </div>
            <div className="relative z-10">
                <IncomeChart />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative liquid-glass-card p-6 h-full overflow-hidden hover:border-blue-500/30 transition-colors duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                        <UsersIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Manage Users</h3>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        Control user accounts, manage subscriptions, and handle permissions.
                    </p>
                </div>
                <Link href="/admin/users" className="mt-6 inline-flex items-center text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                    Access Users <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="group relative liquid-glass-card p-6 h-full overflow-hidden hover:border-amber-500/30 transition-colors duration-300"
          >
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                        <CommandLineIcon className="h-6 w-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Generate Codes</h3>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        Create new redeem codes for subscription plans.
                    </p>
                </div>
                <Link href="/admin/generate-code" className="mt-6 inline-flex items-center text-sm font-medium text-amber-400 group-hover:text-amber-300 transition-colors">
                    Create Codes <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="group relative liquid-glass-card p-6 h-full overflow-hidden hover:border-green-500/30 transition-colors duration-300"
          >
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors duration-500"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                        <SparklesIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Changelog</h3>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        Post updates and announce new features to users.
                    </p>
                </div>
                <Link href="/admin/changelog" className="mt-6 inline-flex items-center text-sm font-medium text-green-400 group-hover:text-green-300 transition-colors">
                    Manage Updates <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
          </motion.div>
        </div>
      </div>
  );
}