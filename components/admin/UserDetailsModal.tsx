import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    _id: string;
    username: string;
    email: string;
    plan: string;
    plan_expires_at: string | null;
    created_at: string;
    rpm?: number;
    rpd?: number;
    last_login?: string;
    total_api_calls?: number;
    status?: 'active' | 'inactive' | 'banned';
    admin_notes?: string;
    tags?: string[];
  };
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  const [usageData, setUsageData] = useState<{
    totalApiCalls: number;
    lastUsageDate: string | null;
    currentUsage: {
      rpmUsed: number;
      rpmLimit: number;
      rpdUsed: number;
      rpdLimit: number;
    } | null;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    if (isOpen && user._id) {
      fetchUsageData();
    }
  }, [isOpen, user._id]);

  const fetchUsageData = async () => {
    setLoadingUsage(true);
    try {
      const response = await fetch(`/api/admin/users/${user._id}/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    
    try {
      if (dateString.includes('T')) {
        return new Date(dateString).toLocaleString();
      } else {
        return new Date(parseInt(dateString) * 1000).toLocaleString();
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'inactive': return 'text-yellow-400 bg-yellow-500/10';
      case 'banned': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-white/60" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Username</p>
                  <p className="text-base font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="text-base font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-lg ${getStatusColor(user.status)}`}>
                    {user.status || 'active'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white/60">User ID</p>
                  <p className="text-base font-mono text-xs">{user._id}</p>
                </div>
              </div>
            </div>

            {/* Plan Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-white/60" />
                Plan Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Current Plan</p>
                  <p className="text-base font-medium">{user.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Expires At</p>
                  <p className="text-base">{formatDate(user.plan_expires_at)}</p>
                </div>
                {user.rpm && (
                  <div>
                    <p className="text-sm text-white/60">Requests Per Minute</p>
                    <p className="text-base font-medium">{user.rpm}</p>
                  </div>
                )}
                {user.rpd && (
                  <div>
                    <p className="text-sm text-white/60">Requests Per Day</p>
                    <p className="text-base font-medium">{user.rpd.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-white/60" />
                Activity Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Created At</p>
                  <p className="text-base">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Last Login</p>
                  <p className="text-base">{formatDate(user.last_login)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Total API Calls</p>
                  <div className="flex items-center gap-2">
                    {loadingUsage ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-white/40" />
                    ) : (
                      <p className="text-base font-medium">
                        {usageData?.totalApiCalls?.toLocaleString() || '0'}
                      </p>
                    )}
                    {usageData?.lastUsageDate && (
                      <span className="text-xs text-white/40">
                        (as of {formatDate(usageData.lastUsageDate)})
                      </span>
                    )}
                  </div>
                </div>
              
              {/* Current Usage Stats */}
              {usageData?.currentUsage && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-neutral-800/30 rounded-lg">
                    <p className="text-sm text-white/60">Today's Usage</p>
                    <p className="text-base font-medium">
                      {usageData.currentUsage.rpdUsed.toLocaleString()} / {usageData.currentUsage.rpdLimit.toLocaleString()}
                    </p>
                    <div className="mt-1 w-full bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((usageData.currentUsage.rpdUsed / usageData.currentUsage.rpdLimit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-800/30 rounded-lg">
                    <p className="text-sm text-white/60">Current RPM</p>
                    <p className="text-base font-medium">
                      {usageData.currentUsage.rpmUsed} / {usageData.currentUsage.rpmLimit}
                    </p>
                    <div className="mt-1 w-full bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((usageData.currentUsage.rpmUsed / usageData.currentUsage.rpmLimit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {user.admin_notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-white/60" />
                  Admin Notes
                </h3>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{user.admin_notes}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {user.tags && user.tags.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {user.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}