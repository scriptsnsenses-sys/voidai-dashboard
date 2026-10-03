import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function BillingPage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Free access</h1>
          <p className="mt-1 text-white/65">VoidAI has no paid plans or subscriptions.</p>
        </div>
        <div className="border-y border-white/10 py-6">
          <p className="text-lg font-semibold text-emerald-400">Free forever</p>
          <p className="mt-2 text-sm text-white/70">
            There are no payments, credit balances, or plan upgrades to manage.
          </p>
        </div>
        <Link href="/dashboard" className="inline-flex text-sm text-emerald-400 hover:text-emerald-300">
          Return to dashboard
        </Link>
      </section>
    </DashboardLayout>
  );
}