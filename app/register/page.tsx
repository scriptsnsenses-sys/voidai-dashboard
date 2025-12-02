"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Spotlight } from '@/components/ui/Spotlight';
import VerificationModal from '@/components/auth/VerificationModal';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const { register } = useAuth();
  const router = useRouter();

  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '09488f44-c57e-45f0-ad28-c17867788dc6';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account');
      return;
    }

    if (!hcaptchaToken) {
      setError('Please complete the CAPTCHA verification');
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

    setLoading(true);

    try {
      const result = await register(username, email, password, hcaptchaToken);

      if (result.success) {
        if (result.requiresVerification) {
          setRegistrationEmail(result.email || email);
          setShowVerification(true);
        }
      } else {
        setError(result.error || 'Failed to create an account');
      }
    } catch (error: any) {
      setError('Failed to create an account');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleVerificationSuccess = () => {
    router.push('/dashboard');
  };

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
              <h2 className="mt-4 text-2xl font-semibold">Create an account</h2>
              <p className="mt-2 text-muted-foreground">Join voidai today</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {showVerification ? (
              <VerificationModal 
                email={registrationEmail} 
                onSuccess={handleVerificationSuccess}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                    placeholder="Choose a username"
                    required
                    disabled={loading}
                  />
                </div>

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
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-500/5 border border-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
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
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    id="agreedToTerms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-500/5 text-blue-400 focus:ring-blue-400 focus:ring-offset-0"
                    required
                    disabled={loading}
                  />
                  <label htmlFor="agreedToTerms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the{' '}
                    <Link 
                      href="/tos" 
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link 
                      href="/privacy" 
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="flex justify-center my-4">
                  <HCaptcha
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={setHcaptchaToken}
                    theme="dark"
                  />
                </div>

                <div>
                  <ShimmerButton
                    type="submit"
                    disabled={loading || !agreedToTerms || !hcaptchaToken}
                    className="w-full py-3"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </ShimmerButton>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
  );
}