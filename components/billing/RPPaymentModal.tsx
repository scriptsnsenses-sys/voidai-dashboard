"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { STRIPE_PUBLIC_KEY } from '@/lib/stripe';
import {
  XMarkIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface RPPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentForm({ onClose, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing/success?type=rp_verification`,
      },
      redirect: 'if_required'
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setLoading(false);
    } else {
      onSuccess();
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <CreditCardIcon className="w-5 h-5 text-purple-400 mr-2" />
          <h3 className="text-lg font-medium text-white">Choose Payment Method</h3>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'paypal'],
              fields: {
                billingDetails: 'auto'
              }
            }}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <ShimmerButton
          type="submit"
          disabled={!stripe || loading}
          variant="gradient"
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Pay $2.50'}
        </ShimmerButton>
      </div>
    </form>
  );
}

function PaymentFormWrapper({ onClose, onSuccess }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/rp-verification/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || 'Failed to initialize payment');
        }
      } catch (err) {
        setError('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-3 text-white/70">Initializing payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
        Failed to initialize payment. Please try again.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#8b5cf6',
            colorBackground: '#171717',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          }
        }
      }}
    >
      <PaymentForm onClose={onClose} onSuccess={onSuccess} />
    </Elements>
  );
}

export default function RPPaymentModal({ isOpen, onClose, onSuccess }: RPPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-neutral-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">RP Models Verification</h2>
              <p className="text-sm text-white/70 mt-1">One-time payment to unlock roleplay models</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <Elements 
            stripe={stripePromise}
            options={{
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#8b5cf6',
                  colorBackground: '#171717',
                  colorText: '#ffffff',
                  colorDanger: '#ef4444',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '8px',
                }
              }
            }}
          >
            <PaymentForm onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}