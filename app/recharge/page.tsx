import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RechargeManager } from '@/components/recharge/RechargeManager';

export const metadata = {
  title: 'Recharge Library — LifeOS',
  description: 'Manage your micro-breaks and energy restoration tasks.',
};

export default async function RechargePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center pt-10 px-4">
      {/* Background ambient glow specific to recharge (emerald) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <RechargeManager />
      </div>
    </div>
  );
}
