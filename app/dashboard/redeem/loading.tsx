import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function RedeemLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {}
        <div>
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-white/5 rounded mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/10">
          <div className="h-6 w-48 bg-white/5 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-white/5 rounded mt-1 animate-pulse"></div>
            </div>

            <div>
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
              <div className="h-6 w-40 bg-white/5 rounded mt-1 animate-pulse"></div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-8">
          <div className="max-w-md">
            <div className="space-y-6">
              <div>
                <div className="h-4 w-32 bg-white/5 rounded mb-2 animate-pulse"></div>
                <div className="h-12 w-full bg-white/5 rounded animate-pulse"></div>
                <div className="h-3 w-64 bg-white/5 rounded mt-1 animate-pulse"></div>
              </div>

              <div>
                <div className="h-10 w-32 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-12 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <div className="h-6 w-48 bg-white/5 rounded mb-4 animate-pulse"></div>

          <div className="h-4 w-full bg-white/5 rounded mb-4 animate-pulse"></div>

          <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}