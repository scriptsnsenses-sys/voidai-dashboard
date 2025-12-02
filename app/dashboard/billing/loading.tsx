import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function BillingLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {}
        <div>
          <div className="h-8 w-64 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-white/5 rounded mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-950/20 to-black/20 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-6 w-48 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-white/5 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>

        {}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-6 w-40 bg-white/5 rounded mb-4 animate-pulse"></div>
          <div className="h-12 w-64 bg-white/5 rounded animate-pulse"></div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col h-full animate-pulse">
              <div className="h-6 w-24 bg-white/5 rounded mb-2"></div>
              <div className="h-4 w-48 bg-white/5 rounded mb-6"></div>

              <div className="h-8 w-32 bg-white/5 rounded mb-6"></div>

              <div className="space-y-3 mb-6 flex-1">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-start">
                    <div className="h-5 w-5 bg-white/5 rounded-full mr-2"></div>
                    <div className="h-5 w-full bg-white/5 rounded"></div>
                  </div>
                ))}
              </div>

              <div className="h-10 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>

        {}
        <div className="mt-10">
          <div className="h-6 w-48 bg-white/5 rounded mx-auto mb-6 animate-pulse"></div>
          <div className="p-6 rounded-xl bg-neutral-800/30 border border-white/10 animate-pulse">
            <div className="h-6 w-40 bg-white/5 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-white/5 rounded mb-8 mx-auto"></div>

            <div className="space-y-6">
              <div>
                <div className="h-4 w-48 bg-white/5 rounded mb-2"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
              </div>

              <div>
                <div className="h-4 w-48 bg-white/5 rounded mb-2"></div>
                <div className="h-8 w-full bg-white/5 rounded"></div>
              </div>

              <div>
                <div className="h-4 w-32 bg-white/5 rounded mb-2"></div>
                <div className="flex justify-center space-x-4">
                  <div className="h-10 w-40 bg-white/5 rounded"></div>
                  <div className="h-10 w-40 bg-white/5 rounded"></div>
                </div>
              </div>
            </div>

            <div className="h-20 w-full bg-white/5 rounded mt-6"></div>

            <div className="h-10 w-48 bg-white/5 rounded mx-auto mt-6"></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}