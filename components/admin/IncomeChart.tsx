"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { Loader2, Calendar, DollarSign, User, Clock } from "lucide-react";

interface MonthlyIncomeData {
  month: string;
  amount: number;
  count: number;
  formattedMonth?: string;
}

interface PurchaseData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  plan: string;
  customerId: string | null;
  userId: string | null;
}

interface IncomeData {
  monthlyIncome: MonthlyIncomeData[];
  purchaseHistory: PurchaseData[];
}

interface UpcomingPayment {
  id: string;
  amount: number;
  currency: string;
  nextPaymentDate: string;
  plan: string;
  customerId: string;
  customer: {
    name: string | null;
    email: string | null;
  };
  user: {
    _id: string;
    username: string;
    email: string;
    plan: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    plan: {
      amount: number;
      currency: string;
      interval: string;
      product: string;
    };
  };
}

interface UpcomingPaymentsData {
  upcomingPayments: UpcomingPayment[];
  summary: {
    totalAmount: number;
    totalCount: number;
    thisMonth: {
      amount: number;
      count: number;
    };
    next30Days: {
      amount: number;
      count: number;
    };
  };
}

interface ChartClickEvent {
  activePayload?: Array<{
    payload: MonthlyIncomeData;
  }>;
}

export default function IncomeChart() {
  const [data, setData] = useState<IncomeData | null>(null);
  const [upcomingData, setUpcomingData] = useState<UpcomingPaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncomeData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/stats/income', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const fetchedData = await response.json();
          setData(fetchedData);
          
          if (fetchedData.monthlyIncome && fetchedData.monthlyIncome.length > 0) {
            const currentDate = new Date();
            const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            
            const monthExists = fetchedData.monthlyIncome.some((m: MonthlyIncomeData) => m.month === currentMonthKey);
            if (monthExists) {
              setSelectedMonth(currentMonthKey);
            } else {
              setSelectedMonth(fetchedData.monthlyIncome[fetchedData.monthlyIncome.length - 1].month);
            }
          }
        } else {
          setError('Failed to fetch income data');
        }
      } catch (error) {
        console.error('Error fetching income data:', error);
        setError('An error occurred while fetching income data');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomeData();
  }, []);

  const fetchUpcomingPayments = async () => {
    setUpcomingLoading(true);
    try {
      const response = await fetch('/api/admin/stats/upcoming-payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const fetchedData = await response.json();
        setUpcomingData(fetchedData);
      } else {
        setError('Failed to fetch upcoming payments data');
      }
    } catch (error) {
      console.error('Error fetching upcoming payments data:', error);
      setError('An error occurred while fetching upcoming payments data');
    } finally {
      setUpcomingLoading(false);
    }
  };

  // Fetch upcoming payments when the tab is clicked
  const handleTabChange = (value: string) => {
    if (value === 'upcoming' && !upcomingData && !upcomingLoading) {
      fetchUpcomingPayments();
    }
  };

  // Format month names for display
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate total income
  const totalIncome = data?.monthlyIncome.reduce((sum, month) => sum + month.amount, 0) || 0;
  const totalPurchases = data?.monthlyIncome.reduce((sum, month) => sum + month.count, 0) || 0;
  
  // Get selected month's data
  const selectedMonthData = selectedMonth 
    ? data?.monthlyIncome.find(m => m.month === selectedMonth) 
    : null;

  // Prepare data for charts with formatted months
  const chartData = data?.monthlyIncome.slice(-12).map(item => ({
    ...item,
    formattedMonth: formatMonth(item.month)
  }));

  // Handle bar click to select a month
  const handleBarClick = (data: ChartClickEvent) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedItem = data.activePayload[0].payload;
      setSelectedMonth(clickedItem.month);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Income Analytics</CardTitle>
        <CardDescription>
          Monthly income and purchase history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">Monthly Income</TabsTrigger>
            <TabsTrigger value="purchases">Recent Purchases</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : (
              <>
                {/* Month selector */}
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="text-sm text-white/60">Click on any bar to view details for that month</p>
                  </div>
                  {selectedMonth && data?.monthlyIncome && data.monthlyIncome.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-white/60">Selected:</label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a month" />
                        </SelectTrigger>
                        <SelectContent>
                          {data.monthlyIncome.map(month => (
                            <SelectItem key={month.month} value={month.month}>
                              {formatMonth(month.month)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Selected month details */}
                {selectedMonthData && (
                  <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h3 className="text-xl font-medium text-blue-300">
                      {formatMonth(selectedMonthData.month)}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-white/60">Revenue</p>
                        <p className="text-2xl font-semibold">{formatCurrency(selectedMonthData.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Purchases</p>
                        <p className="text-2xl font-semibold">{selectedMonthData.count}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      onClick={handleBarClick}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="formattedMonth" 
                        tick={{ fill: 'white', opacity: 0.7 }}
                      />
                      <YAxis 
                        tick={{ fill: 'white', opacity: 0.7 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '4px' }}
                        itemStyle={{ color: '#e0e0e0' }}
                        formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar 
                        dataKey="amount"
                        name="Revenue"
                        cursor="pointer"
                        radius={[4, 4, 0, 0]}
                        activeBar={false}
                      >
                        {chartData?.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.month === selectedMonth ? '#60a5fa' : '#3b82f6'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Total Income Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-800/30 rounded-lg border border-white/10">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-medium text-white/70">Total Revenue</h3>
                    <p className="text-3xl font-semibold mt-1 text-white">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <h3 className="text-lg font-medium text-white/70">Total Purchases</h3>
                    <p className="text-3xl font-semibold mt-1 text-white">{totalPurchases}</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="purchases">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-2 font-medium text-white/80">Date</th>
                      <th className="px-4 py-2 font-medium text-white/80">Amount</th>
                      <th className="px-4 py-2 font-medium text-white/80">Plan</th>
                      <th className="px-4 py-2 font-medium text-white/80">User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.purchaseHistory.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-2 text-white/70">
                          {new Date(purchase.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-white/70">
                          {formatCurrency(purchase.amount)}
                        </td>
                        <td className="px-4 py-2 text-white/70">
                          {purchase.plan}
                        </td>
                        <td className="px-4 py-2 text-white/70">
                          {purchase.userId || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="upcoming">
            {upcomingLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error && !upcomingData ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : upcomingData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-400">Next 30 Days</p>
                        <p className="text-2xl font-semibold text-white">{formatCurrency(upcomingData.summary.next30Days.amount)}</p>
                        <p className="text-sm text-white/60">{upcomingData.summary.next30Days.count} payments</p>
                      </div>
                      <Clock className="h-8 w-8 text-emerald-400/50" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-400">This Month</p>
                        <p className="text-2xl font-semibold text-white">{formatCurrency(upcomingData.summary.thisMonth.amount)}</p>
                        <p className="text-sm text-white/60">{upcomingData.summary.thisMonth.count} payments</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-400/50" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-400">Total Recurring</p>
                        <p className="text-2xl font-semibold text-white">{formatCurrency(upcomingData.summary.totalAmount)}</p>
                        <p className="text-sm text-white/60">{upcomingData.summary.totalCount} active subscriptions</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-400/50" />
                    </div>
                  </div>
                </div>

                {/* Upcoming Payments Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="px-4 py-2 font-medium text-white/80">Next Payment</th>
                        <th className="px-4 py-2 font-medium text-white/80">Amount</th>
                        <th className="px-4 py-2 font-medium text-white/80">Plan</th>
                        <th className="px-4 py-2 font-medium text-white/80">Customer</th>
                        <th className="px-4 py-2 font-medium text-white/80">User</th>
                        <th className="px-4 py-2 font-medium text-white/80">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingData.upcomingPayments.map((payment) => {
                        const daysDiff = Math.ceil((new Date(payment.nextPaymentDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysDiff <= 7;
                        
                        return (
                          <tr key={payment.id} className={`border-b border-white/5 hover:bg-white/5 ${isUrgent ? 'bg-red-500/5' : ''}`}>
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-white/70'}`}>
                                  {new Date(payment.nextPaymentDate).toLocaleDateString()}
                                </span>
                                <span className={`text-xs ${isUrgent ? 'text-red-300' : 'text-white/50'}`}>
                                  {daysDiff > 0 ? `${daysDiff} days` : 'Overdue'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-white/70">
                              <div className="flex flex-col">
                                <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                <span className="text-xs text-white/50">{payment.subscription.plan.interval}ly</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-white/70">
                              {payment.plan}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col">
                                <span className="text-white/70">{payment.customer.name || payment.customer.email}</span>
                                {payment.customer.name && (
                                  <span className="text-xs text-white/50">{payment.customer.email}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {payment.user ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-400" />
                                  <div className="flex flex-col">
                                    <span className="text-white/70">{payment.user.username}</span>
                                    <span className="text-xs text-white/50">{payment.user.plan}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-red-400 text-sm">No User</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.subscription.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {payment.subscription.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60">Click to load upcoming payments</p>
                <button 
                  onClick={fetchUpcomingPayments}
                  className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Load Upcoming Payments
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 