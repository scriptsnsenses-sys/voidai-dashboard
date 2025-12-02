"use client";

import React, { useState } from 'react';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentCheckIcon, 
  ClipboardDocumentIcon, 
  SparklesIcon,
  TicketIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function GenerateCode() {
  const [plan, setPlan] = useState('basic');
  const [durationDays, setDurationDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    plan: string;
    expiryDate: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          durationDays: parseInt(durationDays),
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGeneratedCode({
          code: data.code,
          plan: data.plan,
          expiryDate: data.expiryDate,
        });
      } else {
        setError(data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setError('An error occurred while generating the code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    
    navigator.clipboard.writeText(generatedCode.code)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  };

  return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Generate Redeem Code</h1>
          <p className="text-white/50 mt-1">
            Create redeem codes for different subscription plans
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Form */}
          <div className="lg:col-span-1">
             {generatedCode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="liquid-glass-card p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent"
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 mr-4">
                    <TicketIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Code Ready!</h2>
                    <p className="text-xs text-white/50">Share this with the user</p>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold">Redeem Code</h3>
                    <button
                      onClick={handleCopyCode}
                      className="text-amber-400 hover:text-amber-300 text-xs flex items-center transition-colors"
                    >
                      {copySuccess ? (
                        <>
                          <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-lg text-white break-all tracking-wider font-medium">
                    {generatedCode.code}
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white/70">Plan</span>
                    </div>
                    <span className="text-sm font-medium text-white capitalize">{generatedCode.plan}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white/70">Expires</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {new Date(generatedCode.expiryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                <ShimmerButton
                  onClick={() => setGeneratedCode(null)}
                  className="w-full justify-center bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Generate Another
                </ShimmerButton>
              </motion.div>
            ) : (
              <div className="liquid-glass-card p-6">
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-white/70 mb-2 ml-1">
                        Select Plan
                    </label>
                    <div className="relative">
                        <select
                            id="plan"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                            required
                        >
                            <option value="economy" className="bg-neutral-900">Economy Plan</option>
                            <option value="basic" className="bg-neutral-900">Basic Plan</option>
                            <option value="premium" className="bg-neutral-900">Premium Plan</option>
                            <option value="pro" className="bg-neutral-900">Pro Plan</option>
                            <option value="ultra" className="bg-neutral-900">Ultra Plan</option>
                            <option value="enterprise" className="bg-neutral-900">Enterprise Plan</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>
                    </div>
                    
                    <div>
                    <label htmlFor="durationDays" className="block text-sm font-medium text-white/70 mb-2 ml-1">
                        Duration (Days)
                    </label>
                    <input
                        id="durationDays"
                        type="number"
                        min="1"
                        max="3650"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                    />
                    </div>
                    
                    <div className="pt-2">
                    <ShimmerButton
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center"
                        variant="gradient"
                    >
                        {loading ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2 animate-spin">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Generating...
                        </>
                        ) : (
                        <>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Generate Code
                        </>
                        )}
                    </ShimmerButton>
                    </div>
                </form>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2">
            <div className="liquid-glass-enhanced p-8 h-full">
              <h2 className="text-xl font-bold text-white mb-4">Plan Details Reference</h2>
              <p className="text-white/60 mb-8 leading-relaxed max-w-2xl">
                Use these details to determine which plan is appropriate for your user. 
                Redeem codes grant instant access to these limits.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">                          
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Economy
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span>7 req/min rate limit</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckBadgeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span>1,000 req/day limit</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Basic
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>10 req/min rate limit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>2,000 req/day limit</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-purple-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Premium
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>35 req/min rate limit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>5,000 req/day limit</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Pro
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>75 req/min rate limit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>7,500 req/day limit</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Ultra
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>100 req/min rate limit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>10,000 req/day limit</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                  <h3 className="text-base font-bold mb-3 text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    Enterprise
                  </h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Unlimited requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckBadgeIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>No rate limits</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}