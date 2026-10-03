"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { 
  generateApiKey, 
  getUserKeys, 
  deleteApiKey, 
  disableApiKey, 
  enableApiKey,
  updateKeyLabel
} from '@/lib/api';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

type ApiKey = {
  _id: string;
  key?: string;
  masked_key?: string;
  created_at: string;
  enabled: boolean;
  plan: string;
  label?: string;
};

export default function Keys() {
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '09488f44-c57e-45f0-ad28-c17867788dc6';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyLoading, setKeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelText, setLabelText] = useState('');
  const [labelLoading, setLabelLoading] = useState(false);
  const [showHCaptchaModal, setShowHCaptchaModal] = useState(false);
  const [rerollLoading, setRerollLoading] = useState<string | null>(null);
  const [showRerollConfirm, setShowRerollConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      setLoading(true);
      const data = await getUserKeys();
      setKeys(data || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateKey() {
    try {
      setKeyLoading(true);
      setError('');

      // Skip hCaptcha validation in development
      if (!isDevelopment && !hcaptchaToken) {
        setError('Please complete the CAPTCHA');
        setKeyLoading(false);
        return;
      }
      
      const data = await generateApiKey(hcaptchaToken || undefined);

      if (data.key) {
        setNewKey(data.key);
        setSuccessMessage('API key generated successfully!');
        await fetchKeys();
        setShowHCaptchaModal(false);
        setHcaptchaToken(null);
      } else {
        setError('Failed to generate API key.');
      }
    } catch (err: any) {
      console.error('Error generating API key:', err);
      setError(err.message || 'Failed to generate API key.');
    } finally {
      setKeyLoading(false);
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApiKey(keyId);
      setSuccessMessage('API key deleted successfully.');
      await fetchKeys(); 
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key.');
    }
  }

  async function handleToggleKeyStatus(keyId: string, isEnabled: boolean) {
    try {
      if (isEnabled) {
        await disableApiKey(keyId);
        setSuccessMessage('API key disabled successfully.');
      } else {
        await enableApiKey(keyId);
        setSuccessMessage('API key enabled successfully.');
      }
      await fetchKeys(); 
    } catch (err) {
      console.error('Error toggling API key status:', err);
      setError('Failed to update API key status.');
    }
  }

  async function handleUpdateLabel(keyId: string, label: string) {
    try {
      setLabelLoading(true);
      await updateKeyLabel(keyId, label);
      setSuccessMessage('API key label updated successfully.');
      await fetchKeys(); 
      setEditingLabel(null);
    } catch (err) {
      console.error('Error updating API key label:', err);
      setError('Failed to update API key label.');
    } finally {
      setLabelLoading(false);
    }
  }

  async function handleRerollKey(keyId: string) {
    try {
      setRerollLoading(keyId);
      setError('');

      const response = await fetch(`/api/keys/${keyId}/reroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reroll API key');
      }

      setNewKey(data.key);
      setSuccessMessage('API key rerolled successfully! Make sure to copy your new key.');
      await fetchKeys();
      setShowRerollConfirm(null);
    } catch (err: any) {
      console.error('Error rerolling API key:', err);
      setError(err.message || 'Failed to reroll API key.');
    } finally {
      setRerollLoading(null);
    }
  }

  const isLegacyKey = (key: ApiKey) => {
    return key.masked_key?.includes('(legacy key)') || !key.masked_key;
  };

  const handleCopyKey = () => {
    if (!newKey) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(newKey)
          .then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          })
          .catch(err => {
            console.error("Failed to copy with clipboard API:", err);
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      fallbackCopy();
    }

    function fallbackCopy() {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = newKey || '';
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          console.error('Fallback copy was unsuccessful');
        }

        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }
  };

  const formatKeyForDisplay = (key?: string) => {
    if (!key) return '';
    return `sk-voidai...${key.substring(key.length - 5)}`;
  };

  const clearNewKey = () => {
    setNewKey(null);
    setShowKey(false);
    setCopySuccess(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for accessing the voidai API
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {successMessage && !error && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
            {successMessage}
          </div>
        )}

        {}
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">New API Key Generated</h3>
                <p className="text-sm text-white/70 mb-3">
                  Make sure to copy your new API key now. You won't be able to see it again!
                </p>

                <div className="flex items-center p-3 bg-neutral-900/50 rounded-lg text-sm font-mono border border-white/10">
                  {showKey ? newKey : formatKeyForDisplay(newKey)}

                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="ml-3 p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white/90"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={handleCopyKey}
                    className="ml-1 p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white/90"
                    title="Copy to clipboard"
                  >
                    {copySuccess ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={clearNewKey}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white/90"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {}
        <div className="mt-6">
          <ShimmerButton
            onClick={() => isDevelopment ? handleGenerateKey() : setShowHCaptchaModal(true)}
            disabled={keyLoading || keys.length >= 5}
            className={`flex items-center ${keys.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {keyLoading ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2 animate-spin">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                Generate New API Key
              </>
            )}
          </ShimmerButton>
          <p className="mt-2 text-sm text-white/60">
            You can generate up to 5 API keys. Rate limits are based on your username, not individual keys.
          </p>
        </div>

        {}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your API Keys ({keys.length}/5)</h2>

          {loading ? (
            <div className="text-center py-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 mx-auto animate-spin text-white/30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <p className="mt-2 text-white/60">Loading API keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-neutral-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 mx-auto text-white/30">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
              <p className="mt-2 text-white/60">You don't have any API keys yet</p>
              <p className="text-sm mt-1 text-white/40">Generate a new key to get started</p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-800/50 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {keys.map((key, index) => (
                    <motion.tr 
                      key={key._id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-neutral-900/20"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {key.masked_key || formatKeyForDisplay(key.key)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingLabel === key._id ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={labelText}
                              onChange={(e) => setLabelText(e.target.value)}
                              className="bg-neutral-800 border border-white/10 rounded-lg px-2 py-1 w-full max-w-xs text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter label..."
                              maxLength={50}
                            />
                            <button
                              onClick={() => handleUpdateLabel(key._id, labelText)}
                              disabled={labelLoading}
                              className="ml-2 p-1 rounded-md hover:bg-green-500/10 text-green-400"
                              title="Save label"
                            >
                              {labelLoading ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 animate-spin">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setEditingLabel(null)}
                              className="p-1 rounded-md hover:bg-red-500/10 text-red-400"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center group">
                            <span className={`${key.label ? 'text-white/80' : 'text-white/40 italic'}`}>
                              {key.label || 'No label'}
                            </span>
                            <button
                              onClick={() => {
                                setLabelText(key.label || '');
                                setEditingLabel(key._id);
                              }}
                              className="ml-2 p-1 rounded-md hover:bg-blue-500/10 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit label"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          key.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {key.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        <div className="flex space-x-2">
                          {isLegacyKey(key) && (
                            <button
                              onClick={() => setShowRerollConfirm(key._id)}
                              disabled={rerollLoading === key._id}
                              className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-400"
                              title="Reroll legacy key"
                            >
                              {rerollLoading === key._id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 animate-spin">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleKeyStatus(key._id, key.enabled)}
                            className={`p-1.5 rounded-md ${
                              key.enabled
                                ? 'hover:bg-red-500/10 text-red-400'
                                : 'hover:bg-green-500/10 text-green-400'
                            }`}
                            title={key.enabled ? 'Disable key' : 'Enable key'}
                          >
                            {key.enabled ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteKey(key._id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400"
                            title="Delete key"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        <div className="mt-12 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">How to Use Your API Key</h2>
          <p className="text-white/70 mb-4">
            Include your API key in the Authorization header of your requests:
          </p>

          <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-white/80">
              {`curl -X POST "https://api.voidai.app/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
            </pre>
          </div>

          <div className="mt-6">
            <a 
              href="https://docs.voidai.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View API documentation →
            </a>
          </div>
        </div>
      </div>

      {}
      {showHCaptchaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowHCaptchaModal(false)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Security Verification</h3>
              <button
                onClick={() => setShowHCaptchaModal(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-white/70 mb-4">
              Please complete the verification below to generate a new API key.
            </p>

            <div className="flex justify-center mb-4">
              <HCaptcha
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={setHcaptchaToken}
                theme="dark"
              />
            </div>

            <div className="flex justify-end">
              <ShimmerButton
                onClick={handleGenerateKey}
                disabled={!hcaptchaToken || keyLoading}
                className="w-full"
              >
                {keyLoading ? 'Generating...' : 'Generate Key'}
              </ShimmerButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reroll Confirmation Modal */}
      {showRerollConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRerollConfirm(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-amber-400">Reroll Legacy API Key</h3>
              <button
                onClick={() => setShowRerollConfirm(null)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/70 mb-3">
                This will generate a completely new API key and invalidate the old one.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-200 text-sm">
                  ⚠️ <strong>Warning:</strong> Any applications using the old key will stop working immediately.
                  Make sure to update all your integrations with the new key.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRerollConfirm(null)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ShimmerButton
                onClick={() => handleRerollKey(showRerollConfirm)}
                disabled={rerollLoading === showRerollConfirm}
                variant="amber"
                className="flex-1"
              >
                {rerollLoading === showRerollConfirm ? 'Rerolling...' : 'Reroll Key'}
              </ShimmerButton>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}