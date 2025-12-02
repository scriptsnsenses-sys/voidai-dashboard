"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Spotlight } from '@/components/ui/Spotlight';

function AuthorizeContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState('');
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  useEffect(() => {
    // Fetch client info
    async function fetchClientInfo() {
      if (!clientId) return;
      try {
        const res = await fetch(`/api/oauth/client-info?client_id=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setClientName(data.name);
        }
      } catch {
        // Client info fetch failed, use client_id as fallback
        setClientName(clientId);
      }
    }
    fetchClientInfo();
  }, [clientId]);

  async function handleAuthorize(action: 'approve' | 'deny') {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state,
          action,
        }),
      });

      const data = await res.json();

      if (data.redirect) {
        window.location.href = data.redirect;
      } else if (data.error) {
        setError(data.error_description || 'Authorization failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Please log in to continue.</p>
      </div>
    );
  }

  if (!clientId || !redirectUri) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400">Invalid authorization request.</p>
      </div>
    );
  }

  const scopes = scope ? scope.split(' ').filter(Boolean) : ['profile'];
  const scopeDescriptions: Record<string, string> = {
    profile: 'View your profile information',
    email: 'View your email address',
    openid: 'Authenticate you',
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
          <span className="text-2xl font-bold">V</span>
        </div>
        <h2 className="text-xl font-semibold">
          {clientName || 'An application'} wants to access your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="text-white">{currentUser.email}</span>
        </p>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm font-medium mb-3">This will allow the application to:</p>
        <ul className="space-y-2">
          {scopes.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {scopeDescriptions[s] || s}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAuthorize('deny')}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <ShimmerButton
          onClick={() => handleAuthorize('approve')}
          disabled={loading}
          className="flex-1 py-3"
        >
          {loading ? 'Authorizing...' : 'Authorize'}
        </ShimmerButton>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By authorizing, you agree to share your information with this application.
      </p>
    </div>
  );
}

export default function OAuthAuthorize() {
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
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">voidai</h1>
            <p className="mt-1 text-sm text-muted-foreground">Authorization Request</p>
          </div>

          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <AuthorizeContent />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
