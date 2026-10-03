import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function BillingSuccessPage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Payments are disabled</h1>
        <p className="text-white/70">VoidAI no longer offers paid plans or payment checkout.</p>
        <Link href="/dashboard" className="inline-flex text-sm text-emerald-400 hover:text-emerald-300">
          Return to dashboard
        </Link>
      </section>
    </DashboardLayout>
  );
}