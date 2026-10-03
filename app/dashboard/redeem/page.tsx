import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function RedeemPage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Free access</h1>
        <p className="text-white/70">Redeem codes and paid plans are no longer available.</p>
        <Link href="/dashboard" className="inline-flex text-sm text-emerald-400 hover:text-emerald-300">
          Return to dashboard
        </Link>
      </section>
    </DashboardLayout>
  );
}