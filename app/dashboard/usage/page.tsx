'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface UsageHistoryPoint {
  timestamp: string;
  requests: number;
}

interface UsageHistoryData {
  history: UsageHistoryPoint[];
}

type Period = 'hour' | 'day' | 'week' | 'month';

export default function Usage() {
  const [historyData, setHistoryData] = useState<UsageHistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [periodFilter, setPeriodFilter] = useState<Period>('day');

  useEffect(() => {
    let active = true;

    async function fetchHistoryData() {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await fetch(`/api/usage/history?period=${periodFilter}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load request history.');
        }

        const data = await response.json();
        if (active) setHistoryData(data);
      } catch (error) {
        if (active) {
          console.error('Error fetching request history:', error);
          setHistoryError('Failed to load request history.');
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    fetchHistoryData();
    return () => {
      active = false;
    };
  }, [periodFilter]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return periodFilter === 'hour'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const chartData = (historyData?.history || []).map((point) => ({
    time: formatDate(point.timestamp),
    requests: Number(point.requests) || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold">API Activity</h1>
          <p className="mt-1 text-muted-foreground">Request counts over time.</p>
        </header>

        <section className="rounded-lg border border-white/10 bg-neutral-900/30 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-emerald-400" />
              <h2 className="text-lg font-semibold">Requests</h2>
            </div>
            <div className="flex gap-2" role="group" aria-label="Activity period">
              {(['hour', 'day', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  aria-pressed={periodFilter === period}
                  onClick={() => setPeriodFilter(period)}
                  className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                    periodFilter === period
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-white/60 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">Loading activity...</div>
          ) : historyError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <InformationCircleIcon className="h-10 w-10 text-red-400" />
              <p className="text-red-400">{historyError}</p>
            </div>
          ) : chartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: 'white',
                    }}
                    formatter={(value) => [value, 'Requests']}
                  />
                  <Line type="monotone" dataKey="requests" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No request activity for this period.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}