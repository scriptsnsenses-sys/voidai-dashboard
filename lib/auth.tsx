"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  mongoId?: string; // MongoDB ObjectId for admin checks
  username: string;
  email: string;
  plan: string;
  plan_expires_at?: string;
  verified?: boolean;
  credits?: number;
  credits_last_reset?: string;
  subscription_id?: string;
  cancel_at_period_end?: boolean;
  profile_picture?: string | null;
  rp_verified?: boolean;
  rp_verification_date?: string;
  rp_bonus_tokens_expires?: string;
  rp_discount_used?: boolean;
}

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string;
    requiresVerification?: boolean;
    email?: string;
    codeExpired?: boolean;
  }>;
  register: (
    username: string,
    email: string,
    password: string,
    hcaptchaToken: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
  }>;
  logout: () => void;
  getUserInfo: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<{
    success: boolean;
    message: string;
    alreadyVerified?: boolean;
    expired?: boolean;
  }>;
  resendVerificationCode: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  requestPasswordReset: (email: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  resetPassword: (token: string, email: string, password: string) => Promise<{
    success: boolean;
    message?: string;
    invalidToken?: boolean;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async (): Promise<void> => {
    try {
      setLastChecked(Date.now());

      if (!currentUser) {
        setIsLoading(true);
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const user = {
          ...data,
          plan_expires_at: data.plan_expires_at ? String(data.plan_expires_at) : null
        };
        setCurrentUser(user);
      } else if (response.status === 403 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {

        const data = await response.json();
        if (data.requiresVerification) {

          if (!window.location.pathname.includes('/success')) {
            router.push('/login');
          }
        }
        setCurrentUser(null);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    hcaptchaToken: string
  ): Promise<{
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
  }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, hcaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Registration failed' };
      }

      return { 
        success: true, 
        requiresVerification: data.requiresVerification || false,
        email: data.email 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ 
    success: boolean; 
    error?: string; 
    requiresVerification?: boolean;
    email?: string;
    codeExpired?: boolean;
  }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {

        if (response.status === 403 && data.requiresVerification) {
          return { 
            success: false, 
            error: data.message || 'Email verification required', 
            requiresVerification: true,
            email: data.email,
            codeExpired: data.codeExpired || false
          };
        }

        return { success: false, error: data.message || 'Login failed' };
      }

      await getUserInfo();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<{ 
    success: boolean; 
    message: string;
    alreadyVerified?: boolean;
    expired?: boolean;
  }> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Verification failed',
          expired: data.expired
        };
      }

      if (data.success) {
        await getUserInfo();
      }

      return { 
        success: data.success, 
        message: data.message,
        alreadyVerified: data.alreadyVerified 
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return { 
        success: false, 
        message: 'An error occurred during verification' 
      };
    }
  };

  const resendVerificationCode = async (email: string): Promise<{ 
    success: boolean; 
    message: string;
  }> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Failed to send verification code' 
        };
      }

      return { 
        success: true,
        message: data.message || 'Verification code has been sent' 
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return { 
        success: false, 
        message: 'An error occurred while sending verification code' 
      };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to send reset link' };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (
    token: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    invalidToken?: boolean;
  }> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Failed to reset password',
          invalidToken: data.invalidToken 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    getUserInfo,
    verifyEmail,
    resendVerificationCode,
    requestPasswordReset,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};