"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Spotlight } from '@/components/ui/Spotlight';
import { useAuth } from '@/lib/auth';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { requestPasswordReset } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const result = await requestPasswordReset(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to process your request');
      }
    } catch (error: any) {
      setError('An error occurred. Please try again later.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mb-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-green-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Check your email</h3>
        <p className="text-muted-foreground mb-6">
          We sent a password reset link to <span className="font-medium text-white">{email}</span>
        </p>
        <div className="flex flex-col space-y-3">
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Return to login
          </Link>
          <button 
            onClick={() => setSuccess(false)}
            className="text-sm text-muted-foreground hover:text-white"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            placeholder="Enter your email"
            required
          />
          <p className="mt-2 text-xs text-muted-foreground">
            We'll send you a link to reset your password
          </p>
        </div>

        <div>
          <ShimmerButton
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-grid-white/[0.02]">
      <Spotlight />

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-8 py-10 rounded-2xl border border-white/10 bg-neutral-500/5 backdrop-blur-xl"
        >
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold">voidai</h1>
            </Link>
            <h2 className="mt-4 text-2xl font-semibold">Forgot password?</h2>
            <p className="mt-2 text-muted-foreground">No worries, we'll send you reset instructions</p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                ← Back to login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}