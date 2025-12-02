"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlanEditModal from '@/components/admin/PlanEditModal';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  XMarkIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

type User = {
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

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [planUpdateLoading, setPlanUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isWipingTemp, setIsWipingTemp] = useState(false);
  const [isFixingLifetimeSubscriptions, setIsFixingLifetimeSubscriptions] = useState(false);
  const usersPerPage = 10;
  
  // New state for enhanced features
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('');
  const [stats, setStats] = useState({
    totalByPlan: {} as Record<string, number>,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    activeUsers: 0,
    inactiveUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, selectedPlan, statusFilter]);

  useEffect(() => {
    // Clear messages after 5 seconds
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=${currentPage}&limit=${usersPerPage}&plan=${selectedPlan}`;
      
      // Add advanced filters
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (dateFilter.start) url += `&startDate=${dateFilter.start}`;
      if (dateFilter.end) url += `&endDate=${dateFilter.end}`;
      if (domainFilter) url += `&domain=${domainFilter}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(Math.ceil(data.total / usersPerPage));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats', {
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
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchResults();
  };

  const fetchSearchResults = async () => {
    if (!searchTerm) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${searchTerm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(1); // Search results are all on one page
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedPlan(status);
    setCurrentPage(1);
  };

  const handleEditPlan = (user: User) => {
    setSelectedUser(user);
    setShowPlanModal(true);
  };

  const handlePlanUpdate = async (planData: { plan: string; rpm?: number; rpd?: number }) => {
    if (!selectedUser) return;
    
    setPlanUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/update-plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update user in the local state
        setUsers(users.map(u => 
          u._id === selectedUser._id 
            ? { 
                ...u, 
                plan: planData.plan,
                rpm: planData.rpm,
                rpd: planData.rpd
              } 
            : u
        ));
        
        setSuccessMessage(`Successfully updated ${selectedUser.username}'s plan to ${planData.plan}`);
        setShowPlanModal(false);
      } else {
        setErrorMessage(data.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      setErrorMessage('An error occurred while updating the plan');
    } finally {
      setPlanUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      if (dateString.includes('T')) {
        // ISO format
        return new Date(dateString).toLocaleString();
      } else {
        // Unix timestamp
        return new Date(parseInt(dateString) * 1000).toLocaleString();
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getPlanDisplay = (user: User) => {
    const planMap: {[key: string]: string} = {
      'free': 'Free',
      'economy': 'Economy',
      'basic': 'Basic',
      'premium': 'Premium',
      'pro': 'Pro',
      'ultra': 'Ultra',
      'enterprise': 'Enterprise'
    };

    // If plan is one of our standard plans
    if (planMap[user.plan]) {
      return planMap[user.plan];
    }
    
    // If plan is custom (has RPM or RPD)
    if (user.rpm || user.rpd) {
      return 'Custom';
    }
    
    // Otherwise, just capitalize first letter
    return user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
  };

  const getPlanColorClass = (plan: string) => {
    switch(plan.toLowerCase()) {
      case 'free': return 'bg-gray-500/20 text-gray-400';
      case 'economy': return 'bg-gray-500/20 text-gray-400';
      case 'basic': return 'bg-blue-500/20 text-blue-400';
      case 'premium': return 'bg-purple-500/20 text-purple-400';
      case 'pro': return 'bg-emerald-500/20 text-emerald-400';
      case 'ultra': return 'bg-amber-500/20 text-amber-400';
      case 'enterprise': return 'bg-red-500/20 text-red-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const handleBan = async (user: User) => {
    if (!window.confirm(`Are you sure you want to ban ${user.username}?`)) return;
    try {
      const response = await fetch(`/api/admin/users/${user._id}/ban`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setUsers(users.filter(u => u._id !== user._id));
        setSuccessMessage(`${user.username} has been banned`);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to ban user');
      }
    } catch {
      setErrorMessage('An error occurred while banning the user');
    }
  };

  const handleWipeTempEmails = async () => {
    if (!window.confirm('This will permanently delete all users with temporary email addresses. Are you sure?')) {
      return;
    }

    setIsWipingTemp(true);
    try {
      const response = await fetch('/api/admin/wipe-temp-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        fetchUsers(); // Refresh the user list
      } else {
        setErrorMessage(data.error || 'Failed to delete temp email users');
      }
    } catch (error) {
      console.error('Error wiping temp email users:', error);
      setErrorMessage('An error occurred while deleting temp email users');
    } finally {
      setIsWipingTemp(false);
    }
  };

  const handleFixLifetimeSubscriptions = async () => {
    // First check how many users would be affected
    try {
      const checkResponse = await fetch('/api/admin/fix-lifetime-subscriptions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        if (checkData.totalAffected === 0) {
          setSuccessMessage('No users with 100-year subscriptions found. All good!');
          return;
        }

        // Show confirmation with details
        const confirmed = window.confirm(
          `Found ${checkData.totalAffected} users with 100-year lifetime subscriptions.\n\n` +
          'This will change them to 1-year subscriptions from their original purchase date.\n\n' +
          'Are you sure you want to proceed?'
        );

        if (!confirmed) return;

        setIsFixingLifetimeSubscriptions(true);

        // Perform the fix
        const fixResponse = await fetch('/api/admin/fix-lifetime-subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const fixData = await fixResponse.json();

        if (fixResponse.ok) {
          setSuccessMessage(fixData.message);
          fetchUsers(); // Refresh the user list
        } else {
          setErrorMessage(fixData.error || 'Failed to fix lifetime subscriptions');
        }
      } else {
        setErrorMessage('Failed to check for users with 100-year subscriptions');
      }
    } catch (error) {
      console.error('Error fixing lifetime subscriptions:', error);
      setErrorMessage('An error occurred while fixing lifetime subscriptions');
    } finally {
      setIsFixingLifetimeSubscriptions(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.size > 0 ? Array.from(selectedUsers) : null
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage('Users exported successfully');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      setErrorMessage('Failed to export users');
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedUsers.size === 0) {
      setErrorMessage('No users selected');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds: Array.from(selectedUsers),
          data
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message);
        setSelectedUsers(new Set());
        fetchUsers();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Bulk action failed');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setErrorMessage('An error occurred during bulk action');
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
            <p className="text-white/50 mt-1">
              View and manage {stats.activeUsers} active users across the system
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 liquid-glass-button text-green-400 text-sm font-medium flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2.5 liquid-glass-button text-sm font-medium flex items-center gap-2 ${showAdvancedFilters ? 'text-white border-blue-500/30 bg-blue-500/10' : 'text-blue-400'}`}
            >
                <FunnelIcon className="h-4 w-4" />
                Filters
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">New Today</p>
                <p className="text-2xl font-bold text-white">{stats.newUsersToday}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">This Week</p>
                <p className="text-2xl font-bold text-white">{stats.newUsersWeek}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="liquid-glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">{stats.newUsersMonth}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Inactive</p>
                <p className="text-2xl font-bold text-white">{stats.inactiveUsers}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success and Error Messages */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
            {successMessage && (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="p-4 rounded-xl bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-400 shadow-lg pointer-events-auto"
            >
                {successMessage}
            </motion.div>
            )}
            
            {errorMessage && (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="p-4 rounded-xl bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-400 shadow-lg pointer-events-auto"
            >
                {errorMessage}
            </motion.div>
            )}
        </div>

        <div className="flex flex-col space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 liquid-glass-enhanced p-4 rounded-2xl">
            <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-md relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-black/20 border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-white/30"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <button type="submit" className="hidden">Search</button>
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 h-11">
                    <span className="text-sm text-white/50 mr-2">Plan:</span>
                    <select
                        value={selectedPlan}
                        onChange={(e) => {
                            setSelectedPlan(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-transparent border-none focus:ring-0 text-white text-sm font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-neutral-900">All</option>
                        <option value="free" className="bg-neutral-900">Free</option>
                        <option value="economy" className="bg-neutral-900">Economy</option>
                        <option value="basic" className="bg-neutral-900">Basic</option>
                        <option value="premium" className="bg-neutral-900">Premium</option>
                        <option value="pro" className="bg-neutral-900">Pro</option>
                        <option value="ultra" className="bg-neutral-900">Ultra</option>
                        <option value="enterprise" className="bg-neutral-900">Enterprise</option>
                        <option value="custom" className="bg-neutral-900">Custom</option>
                    </select>
                </div>

              {selectedUsers.size > 0 ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm">
                    {selectedUsers.size} selected
                  </div>
                  <button
                    onClick={() => setSelectedUsers(new Set())}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete Selected"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('ban')}
                    className="p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors"
                    title="Ban Selected"
                  >
                    <NoSymbolIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                 <>
                    <button
                        onClick={handleWipeTempEmails}
                        disabled={isWipingTemp}
                        className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                        {isWipingTemp ? 'Cleaning...' : 'Clean Temp Users'}
                    </button>
                    
                    <button
                        onClick={handleFixLifetimeSubscriptions}
                        disabled={isFixingLifetimeSubscriptions}
                        className="px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                        >
                        {isFixingLifetimeSubscriptions ? (
                            'Fixing...'
                        ) : (
                            <>
                            <WrenchScrewdriverIcon className="h-4 w-4" />
                            Fix Subs
                            </>
                        )}
                    </button>
                 </>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="liquid-glass-card p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                  >
                    <option value="all" className="bg-neutral-900">All Status</option>
                    <option value="active" className="bg-neutral-900">Active</option>
                    <option value="inactive" className="bg-neutral-900">Inactive</option>
                    <option value="banned" className="bg-neutral-900">Banned</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Email Domain</label>
                  <input
                    type="text"
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    placeholder="e.g., gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none transition-colors placeholder:text-white/20"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Date From</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Date To</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setDomainFilter('');
                    setDateFilter({ start: '', end: '' });
                  }}
                  className="px-4 py-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="h-20 w-full bg-white/5 rounded-2xl"></div>
             ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 liquid-glass-card border-dashed border-white/10">
            <div className="p-4 rounded-full bg-white/5 mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white">No users found</h3>
            <p className="text-white/40 mt-1">Try adjusting your search or filters</p>
            <button
                onClick={() => {setSearchTerm(''); setStatusFilter('all'); setSelectedPlan('all');}}
                className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
            >
                Clear all filters
            </button>
          </div>
        ) : (
          <div className="liquid-glass-enhanced overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center h-5">
                        <input
                            type="checkbox"
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Status / Expiry
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                         <div className="flex items-center h-5">
                            <input
                            type="checkbox"
                            checked={selectedUsers.has(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                            />
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-lg">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{user.username}</div>
                                <div className="text-xs text-white/40">{user.email}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            user.plan === 'free' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                            user.plan === 'economy' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            user.plan === 'basic' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                            user.plan === 'premium' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                            user.plan === 'pro' ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' :
                            user.plan === 'ultra' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {getPlanDisplay(user)}
                        </div>
                        {user.rpm && user.rpd && (
                            <div className="text-[10px] text-white/30 mt-1 font-mono">
                                {user.rpm} RPM / {user.rpd >= 1000 ? `${(user.rpd/1000).toFixed(1)}k` : user.rpd} RPD
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                             <span className="text-sm text-white/70">
                                {user.plan_expires_at ? formatDate(user.plan_expires_at) : 'Lifetime'}
                             </span>
                             <span className="text-[10px] text-white/30">
                                Created {new Date(user.created_at).toLocaleDateString()}
                             </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="View Details"
                            >
                            <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                            onClick={() => handleEditPlan(user)}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Edit Plan"
                            >
                            <WrenchScrewdriverIcon className="h-4 w-4" />
                            </button>
                            <button
                            onClick={() => handleBan(user)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Ban User"
                            >
                            <NoSymbolIcon className="h-4 w-4" />
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer / Pagination */}
             {!searchTerm && (
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/5">
                    <div className="text-sm text-white/40">
                        Showing page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-sm text-white transition-colors"
                        >
                        Previous
                        </button>
                        <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-sm text-white transition-colors"
                        >
                        Next
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Plan Edit Modal */}
        {selectedUser && (
          <PlanEditModal
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            onSave={handlePlanUpdate}
            currentPlan={selectedUser.plan}
            userId={selectedUser._id}
            username={selectedUser.username}
          />
        )}
        
        {/* User Details Modal */}
        {selectedUser && (
          <UserDetailsModal
            isOpen={showUserDetailsModal}
            onClose={() => setShowUserDetailsModal(false)}
            user={selectedUser}
          />
        )}
      </div>
  );
}