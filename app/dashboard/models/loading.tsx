import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function ModelsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 bg-neutral-800/70 rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-neutral-800/50 rounded-md mt-2 animate-pulse"></div>
        </div>

        {}
        <div className="flex space-x-4 border-b border-white/10 pb-2">
          <div className="h-8 w-24 bg-neutral-800/70 rounded-md animate-pulse"></div>
          <div className="h-8 w-24 bg-neutral-800/70 rounded-md animate-pulse"></div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="p-6 rounded-xl border border-white/10 bg-neutral-800/50 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-neutral-700/70 mr-3"></div>
                <div>
                  <div className="h-5 w-24 bg-neutral-700/70 rounded mb-2"></div>
                  <div className="h-4 w-16 bg-neutral-700/50 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-neutral-700/30 rounded"></div>
                <div className="h-4 w-full bg-neutral-700/30 rounded"></div>
                <div className="h-4 w-3/4 bg-neutral-700/30 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}