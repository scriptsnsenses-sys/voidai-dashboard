import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function UsageLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="h-8 w-32 bg-neutral-800/70 rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-neutral-800/50 rounded-md mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-neutral-800/70 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-6 w-24 bg-neutral-700/50 rounded mb-2"></div>
              <div className="h-10 w-32 bg-neutral-700/50 rounded"></div>
              <div className="mt-4 flex space-x-2">
                <div className="h-4 w-20 bg-neutral-700/50 rounded"></div>
                <div className="h-4 w-4 bg-neutral-700/50 rounded"></div>
                <div className="h-4 w-24 bg-neutral-700/50 rounded"></div>
              </div>
              <div className="mt-4 h-2 bg-neutral-700/50 rounded-full"></div>
            </div>
          ))}
        </div>

        {}
        <div className="mt-8">
          <div className="h-6 w-40 bg-neutral-800/70 rounded-md mb-4 animate-pulse"></div>

          <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-neutral-800 border-b border-white/10 p-4">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 w-full bg-neutral-700/50 rounded"></div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-5 w-full bg-neutral-700/30 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="mt-12 p-6 rounded-xl bg-neutral-800/30 border border-white/10">
          <div className="h-6 w-40 bg-neutral-700/50 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-700/30 rounded"></div>
            <div className="h-4 w-full bg-neutral-700/30 rounded"></div>
            <div className="h-4 w-3/4 bg-neutral-700/30 rounded"></div>
          </div>
          <div className="mt-4 pl-4 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-5/6 bg-neutral-700/30 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}