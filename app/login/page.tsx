"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Spotlight } from '@/components/ui/Spotlight';
import VerificationModal from '@/components/auth/VerificationModal';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [codeExpired, setCodeExpired] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);

      if (result.success) {
        router.push(from || '/dashboard');
      } else if (result.requiresVerification) {
        setVerificationNeeded(true);
        setVerificationEmail(result.email || email);
        setCodeExpired(result.codeExpired || false);
        setError('');
      } else {
        setError(result.error || 'Failed to log in');
      }
    } catch (error: any) {
      setError('Failed to log in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleVerificationSuccess = () => {

    router.push('/dashboard');
  };

  if (verificationNeeded) {
    return (
      <div className="mb-8">
        <VerificationModal 
          email={verificationEmail} 
          onSuccess={handleVerificationSuccess}
          codeExpired={codeExpired}
        />

        <div className="mt-4 text-center">
          <button
            onClick={() => setVerificationNeeded(false)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Back to Login
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            placeholder="Enter your password"
            required
          />
        </div>

        <div>
          <ShimmerButton
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
}

export default function Login() {
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
            <h2 className="mt-4 text-2xl font-semibold">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account</p>
          </div>

          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}