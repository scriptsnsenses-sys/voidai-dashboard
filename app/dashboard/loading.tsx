import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {}
        <div>
          <div className="h-8 w-64 bg-white/5 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-white/5 rounded mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-6 w-48 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-white/5 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-black/20 p-6">
            <div className="h-12 w-12 bg-white/5 rounded mb-4 animate-pulse"></div>
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-white/5 rounded mt-2 mb-4 animate-pulse"></div>
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-6">
            <div className="h-12 w-12 bg-white/5 rounded mb-4 animate-pulse"></div>
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-white/5 rounded mt-2 mb-4 animate-pulse"></div>
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>

        {}
        <div className="mt-8 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <div className="h-6 w-48 bg-white/5 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-6 w-36 bg-white/5 rounded mb-2 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="h-6 w-32 bg-white/5 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-full bg-white/5 rounded mb-4 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-40 bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-36 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}