import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsManager } from '@/components/settings/SettingsManager';

export const metadata = {
  title: 'Settings — LifeOS',
  description: 'Manage your LifeOS preferences and routines.',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center pt-10 px-4 pb-20">
      <SettingsManager />
    </div>
  );
}
