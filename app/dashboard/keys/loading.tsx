import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function KeysLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {}
        <div>
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-white/5 rounded mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="mt-6">
          <div className="h-10 w-48 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-white/5 rounded mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="mt-8">
          <div className="h-6 w-40 bg-white/5 rounded mb-4 animate-pulse"></div>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-neutral-800/50 border-b border-white/10 p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-neutral-900/20">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-4 w-36 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-6 w-16 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-white/5 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="mt-12 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <div className="h-6 w-48 bg-white/5 rounded mb-4 animate-pulse"></div>
          <div className="h-4 w-full bg-white/5 rounded mb-4 animate-pulse"></div>

          <div className="bg-neutral-900 rounded-lg p-4 h-32 animate-pulse"></div>

          <div className="mt-6">
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}