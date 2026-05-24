import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CheckInForm } from '@/components/checkin/CheckInForm';

export const metadata = {
  title: 'Night Check-In — LifeOS',
};

export default async function CheckInPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pt-10 px-4 pb-24">
      <CheckInForm />
    </div>
  );
}
