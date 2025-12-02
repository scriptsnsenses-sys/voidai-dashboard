"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

interface VerificationModalProps {
  email: string;
  onSuccess?: () => void;
  codeExpired?: boolean;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ 
  email, 
  onSuccess,
  codeExpired = false
}) => {

  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const savedCodeRef = useRef<string>(''); 
  const { verifyEmail, resendVerificationCode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    savedCodeRef.current = verificationCode;
    console.log(`Code updated: ${verificationCode} (Length: ${verificationCode.length})`);
  }, [verificationCode]);

  useEffect(() => {
    if (codeExpired) {
      setMessage('Your verification code has expired. Please request a new one.');
    }
  }, [codeExpired]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
      savedCodeRef.current = value; 

      if (value.length === 6) {
        console.log(`Auto-submitting with code: ${value}`);

        setTimeout(() => handleVerify(value), 100);
      }
    }
  };

  const handleVerify = async (manualCode?: string) => {

    const codeToVerify = manualCode || savedCodeRef.current || verificationCode;

    console.log(`Attempting verification with code: ${codeToVerify} Length: ${codeToVerify.length}`);

    const inputValue = codeInputRef.current?.value;
    console.log(`Direct input value: ${inputValue}, Length: ${inputValue?.length || 0}`);

    if (!codeToVerify || codeToVerify.length !== 6 || !/^\d{6}$/.test(codeToVerify)) {
      setError(`Please enter all 6 digits of your verification code. You entered: ${codeToVerify || '[empty]'}`);
      return;
    }

    try {
      setIsVerifying(true);
      setError('');
      setMessage('');

      console.log(`Sending verification request with code: ${codeToVerify}`);
      const result = await verifyEmail(email, codeToVerify);

      if (result.success) {
        setMessage(result.message || 'Email verified successfully!');
        if (result.alreadyVerified) {

          router.push('/dashboard');
        } else if (onSuccess) {

          onSuccess();
        } else {

          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        if (result.expired) {
          setError('This verification code has expired. Please request a new one.');
        } else {
          setError(result.message || 'Verification failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyButtonClick = () => {

    const manualCode = codeInputRef.current?.value || '';
    console.log(`Verify button clicked. Manual code from input: ${manualCode}, Length: ${manualCode.length}`);
    handleVerify(manualCode);
  };

  const handleResendCode = async () => {
    try {
      setIsSendingCode(true);
      setError('');
      setMessage('');

      const result = await resendVerificationCode(email);

      if (result.success) {
        setMessage(result.message || 'A new verification code has been sent to your email');

        setVerificationCode('');
        savedCodeRef.current = '';

        codeInputRef.current?.focus();

        setTimeLeft(60);
      } else {
        setError(result.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An error occurred while sending the verification code');
      console.error(err);
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-neutral-800/50 border border-white/10">
      <h2 className="text-xl font-semibold mb-4">Verify Your Email</h2>

      <p className="text-white/70 mb-6">
        We've sent a 6-digit verification code to <strong>{email}</strong>. 
        Please enter the code below to verify your email address.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {message}
        </div>
      )}

      <div className="mb-6">
        <input
          ref={codeInputRef}
          type="text"
          value={verificationCode}
          onChange={handleCodeChange}
          placeholder="Enter 6-digit code"
          className="w-full px-4 py-3 text-center text-lg font-mono bg-neutral-700/30 border border-white/10 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          autoFocus
          inputMode="numeric"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <ShimmerButton
          onClick={handleVerifyButtonClick} 
          disabled={isVerifying}
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </ShimmerButton>

        <ShimmerButton
          onClick={handleResendCode}
          disabled={isSendingCode || timeLeft > 0}
          className="w-full bg-neutral-700/50"
        >
          {isSendingCode ? 'Sending...' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
        </ShimmerButton>
      </div>

      <p className="text-sm text-white/50 text-center">
        The verification code will expire in 10 minutes. If you don't receive the code, 
        check your spam folder or click "Resend Code".
      </p>
    </div>
  );
};

export default VerificationModal;