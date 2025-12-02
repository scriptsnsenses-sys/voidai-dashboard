// app/admin/layout.tsx
"use client";

import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push('/login?from=/admin');
      } else {
        // Debug logging
        console.log('Admin check - Current user:', {
          id: currentUser.id,
          mongoId: currentUser.mongoId,
          email: currentUser.email
        });
        console.log('Admin check - ADMIN_USER_IDS:', ADMIN_USER_IDS);
        console.log('Admin check - mongoId in admin list?', currentUser.mongoId && ADMIN_USER_IDS.includes(currentUser.mongoId));
        console.log('Admin check - id in admin list?', currentUser.id && ADMIN_USER_IDS.includes(currentUser.id));
        
        if (currentUser.mongoId && ADMIN_USER_IDS.includes(currentUser.mongoId)) {
          console.log('Admin access granted via mongoId');
          setIsAdmin(true);
        } else if (currentUser.id && ADMIN_USER_IDS.includes(currentUser.id)) {
          console.log('Admin access granted via id (fallback)');
          setIsAdmin(true);
        } else {
          console.log('Admin access denied');
          setIsAdmin(false);
          // Not an admin, redirect to dashboard
          router.push('/dashboard');
        }
      }
    }
  }, [currentUser, isLoading, router]);

  // Show loading state while checking admin status
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <svg 
            className="animate-spin h-12 w-12 text-white/20" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-white/70">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-xl border border-white/10 bg-neutral-900/50">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-12 h-12 mx-auto text-red-400 mb-4"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" 
            />
          </svg>
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-white/70">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}