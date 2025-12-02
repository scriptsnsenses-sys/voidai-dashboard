'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react';

interface UsageData {
  userId: string;
  username: string;
  email: string;
  plan: string;
  dailyTotal: number;
  tokensUsed: number;
  creditsUsed: number;
  rpmPeak: number;
  rpmLimit: number;
  rpdLimit: number;
  lastRequestAt: string;
  models: Record<string, number>;
  hourlyDistribution: Array<{ hour: number; requests: number }>;
}

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCredits: number;
  totalUsers: number;
  avgRequestsPerUser: number;
  planDistribution: Record<string, number>;
}

export default function UsageMonitoringPage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState<'dailyTotal' | 'rpmPeak'>('dailyTotal');
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/usage-monitoring?date=${selectedDate}&sortBy=${sortBy}&page=${page}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsageData(data.data);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [selectedDate, sortBy, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchUsageData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDate, sortBy, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500',
      economy: 'bg-blue-500',
      basic: 'bg-green-500',
      premium: 'bg-purple-500',
      ultra: 'bg-red-500',
      pro: 'bg-yellow-500',
      enterprise: 'bg-indigo-500',
      custom: 'bg-pink-500'
    };
    return colors[plan] || 'bg-gray-500';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Usage Monitoring</h1>
            <p className="text-white/50 mt-1">Real-time usage tracking and analytics for all VoidAI users</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                <CalendarIcon className="h-4 w-4 text-white/50" />
                <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                }}
                max={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-none text-white text-sm focus:ring-0 p-0 [color-scheme:dark]"
                />
            </div>
            <Button
                variant="ghost"
                onClick={fetchUsageData}
                disabled={loading}
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
            >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
                className={autoRefresh ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'}
            >
                <div className={`w-2 h-2 rounded-full mr-2 ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
                Auto-Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pb-2 border-b border-white/5">
            <Button
              variant="ghost"
              onClick={() => {
                setSortBy('dailyTotal');
                setPage(1);
              }}
              size="sm"
              className={`text-sm font-medium transition-colors ${sortBy === 'dailyTotal' ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              Sort by Daily Total
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSortBy('rpmPeak');
                setPage(1);
              }}
              size="sm"
              className={`text-sm font-medium transition-colors ${sortBy === 'rpmPeak' ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              Sort by RPM Peak
            </Button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="liquid-glass-card p-5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Total Requests</div>
              <div className="text-2xl font-bold text-white">{formatNumber(summary.totalRequests)}</div>
            </div>
             <div className="liquid-glass-card p-5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Total Tokens</div>
              <div className="text-2xl font-bold text-white text-blue-300">{formatNumber(summary.totalTokens)}</div>
            </div>
             <div className="liquid-glass-card p-5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Total Credits</div>
              <div className="text-2xl font-bold text-white text-purple-300">{formatNumber(summary.totalCredits)}</div>
            </div>
            <div className="liquid-glass-card p-5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Active Users</div>
              <div className="text-2xl font-bold text-white">{formatNumber(summary.totalUsers)}</div>
            </div>
            <div className="liquid-glass-card p-5">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Plan Dist</div>
              <div className="space-y-1.5">
                {Object.entries(summary.planDistribution).slice(0, 3).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-white/70">{plan}</span>
                    <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="liquid-glass-enhanced overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Plan</th>
                  <th className="text-right px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Requests</th>
                  <th className="text-right px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Tokens</th>
                  <th className="text-right px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Credits</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Top Models</th>
                  <th className="text-left px-6 py-4 font-semibold text-xs text-white/40 uppercase tracking-wider">Last Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-white/30">
                      <RefreshCwIcon className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                      Loading usage data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-red-400">
                      Error: {error}
                    </td>
                  </tr>
                ) : usageData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-white/30">
                      No usage data available for this date
                    </td>
                  </tr>
                ) : (
                  usageData.map((user, index) => {
                    const rank = (page - 1) * 50 + index + 1;
                    const topModels = Object.entries(user.models)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3);
                    
                    return (
                      <tr key={`${user.userId}-${index}`} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white/70">
                            <span className="font-mono">#{rank}</span>
                            {rank <= 3 && <TrendingUpIcon className="h-4 w-4 text-amber-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{user.username}</div>
                            <div className="text-xs text-white/40">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${
                            user.plan === 'free' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                            user.plan === 'economy' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            user.plan === 'basic' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                            user.plan === 'premium' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                            user.plan === 'ultra' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-white/10 border-white/20 text-white'
                          }`}>
                            {user.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-white font-mono">{formatNumber(user.dailyTotal)}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-blue-300 font-mono">{formatNumber(user.tokensUsed)}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-purple-300 font-mono">{formatNumber(user.creditsUsed)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {topModels.map(([model, count]) => (
                              <div key={String(model)} className="text-xs flex items-center justify-between gap-2">
                                <span className="font-medium text-white/60 truncate max-w-[100px]" title={String(model)}>{String(model)}</span>
                                <span className="text-white/40 font-mono">{count}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-white/50">
                            {new Date(user.lastRequestAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                <div className="text-xs text-white/40">
                    Page {page} of {totalPages}
                </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}