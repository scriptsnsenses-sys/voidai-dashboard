'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  ChartBarIcon, 
  ClockIcon, 
  BanknotesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UsageHistoryPoint {
  timestamp: string;
  creditsUsed: number;
  plan: string;
}

interface UsageHistoryData {
  history: UsageHistoryPoint[];
  period: string;
  startTime: string;
  endTime: string;
}

export default function Usage() {
  const { currentUser } = useAuth();
  const [historyData, setHistoryData] = useState<UsageHistoryData | null>(null);
  const [creditInfo, setCreditInfo] = useState<{
    currentCredits: number;
    dailyLimit: number;
    creditsUsed: number;
    resetTime: string;
    plan: string;
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [creditLoading, setCreditLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchHistoryData();
    fetchCreditData();
  }, []);

  useEffect(() => {
    fetchHistoryData();
  }, [periodFilter]);

  async function fetchHistoryData() {
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/usage/history?period=${periodFilter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        setHistoryError('Failed to load usage history.');
      }
    } catch (err) {
      console.error('Error fetching usage history:', err);
      setHistoryError('Failed to load usage history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function fetchCreditData() {
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
      }
    } catch (err) {
      console.error('Error fetching credit data:', err);
    } finally {
      setCreditLoading(false);
    }
  }

  const formatNumber = (num: number | string) => {
    // Convert to number if it's a string
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    // Check if it's a valid number
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0';
    }
    
    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    } else if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    }
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (periodFilter === 'hour') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatChartData = (data: UsageHistoryPoint[] | undefined) => {
    if (!data || data.length === 0) return [];

    return data.map(point => ({
      ...point,
      time: formatDate(point.timestamp),
      creditsUsed: typeof point.creditsUsed === 'number' ? point.creditsUsed : 0
    }));
  };

  const getCreditPercentage = () => {
    if (!creditInfo) return 0;
    return ((creditInfo.dailyLimit - creditInfo.currentCredits) / creditInfo.dailyLimit) * 100;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Credit Usage & History</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your API credit usage and track your daily consumption.
          </p>
        </div>

                {/* Daily Credit Status */}
                <div className="rounded-lg border border-white/10 bg-neutral-900/30 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Daily Credit Status</h2>
                    <div className="flex items-center gap-4">
                      {creditInfo && (
                        <div className="text-sm text-muted-foreground">
                          Plan: <span className="text-white capitalize">{creditInfo.plan}</span>
                        </div>
                      )}
                    </div>
                  </div>
          
          {creditLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
              <div className="h-2 bg-white/10 rounded w-full"></div>
            </div>
          ) : creditInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Credits Remaining</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {formatNumber(creditInfo.currentCredits)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Credits Used Today</div>
                  <div className="text-3xl font-bold text-orange-400">
                    {formatNumber(creditInfo.creditsUsed)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Daily Limit</div>
                  <div className="text-3xl font-bold text-white">
                    {formatNumber(creditInfo.dailyLimit)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Usage Progress</div>
                <div className="bg-neutral-700/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${getCreditPercentage()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resets in {getTimeUntilReset()}</span>
                  <span className="text-muted-foreground">{getCreditPercentage().toFixed(1)}% used</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <InformationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">Unable to load credit information</p>
            </div>
          )}
        </div>

        {/* Usage History */}
        <div className="rounded-lg border border-white/10 bg-neutral-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-lg font-semibold">Usage History</h2>
            </div>
            
            {/* Period Filter */}
            <div className="flex gap-2">
              {['hour', 'day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodFilter(period as any)}
                  className={`
                    px-3 py-1 rounded text-sm capitalize transition-colors
                    ${periodFilter === period
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-800 text-white/60 hover:text-white'
                    }
                  `}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">Loading usage history...</div>
            </div>
          ) : historyError ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <InformationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{historyError}</p>
              </div>
            </div>
          ) : historyData && historyData.history.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatChartData(historyData.history)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                    formatter={(value: any) => [formatNumber(value), 'Credits Used']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="creditsUsed" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No usage data available for the selected period.</p>
              </div>
            </div>
          )}
        </div>

        {/* Understanding Credits Section */}
        <div className="rounded-lg border border-white/10 bg-neutral-900/30 p-6">
          <h2 className="text-lg font-semibold mb-6">Understanding Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-medium mb-3">How Credits Work</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Credits are consumed based on the AI model you use</li>
                <li>• Different models have different credit costs per token</li>
                <li>• Credits reset daily at midnight UTC</li>
                <li>• Unused credits do not roll over to the next day</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-medium mb-3">Optimizing Usage</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use efficient models for simple tasks</li>
                <li>• Monitor your usage patterns</li>
                <li>• Consider upgrading for higher limits</li>
                <li>• Track peak usage times</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}