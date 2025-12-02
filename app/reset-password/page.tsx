"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Spotlight } from '@/components/ui/Spotlight';
import { useAuth } from '@/lib/auth';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { resetPassword } = useAuth();

  useEffect(() => {
    if (!token || !email) {
      setInvalidToken(true);
    }
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const result = await resetPassword(token!, email!, password);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to reset password');
        if (result.invalidToken) {
          setInvalidToken(true);
        }
      }
    } catch (error: any) {
      setError('An error occurred. Please try again later.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (invalidToken) {
    return (
      <div className="mb-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Invalid or expired link</h3>
        <p className="text-muted-foreground mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password">
          <ShimmerButton className="w-full py-3">
            Request a new reset link
          </ShimmerButton>
        </Link>
      </div>
    );
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
        <h3 className="text-xl font-medium mb-2">Password reset complete</h3>
        <p className="text-muted-foreground mb-6">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <Link href="/login">
          <ShimmerButton className="w-full py-3">
            Go to login
          </ShimmerButton>
        </Link>
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
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            placeholder="Enter your new password"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            placeholder="Confirm your new password"
            required
          />
        </div>

        <div>
          <ShimmerButton
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Resetting password...' : 'Reset password'}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
}

export default function ResetPassword() {
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
            <h2 className="mt-4 text-2xl font-semibold">Reset your password</h2>
            <p className="mt-2 text-muted-foreground">Enter your new password below</p>
          </div>

          <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>
          
        </motion.div>
      </div>
    </div>
  );
} 