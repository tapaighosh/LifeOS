import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DayPlan } from '@/components/plan/DayPlan';

export const metadata = {
  title: 'Dashboard — LifeOS',
  description: 'Your daily plan and insights.',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // Get current hour to greet appropriately
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  // For a personalized feel if we had the user's name:
  // We'll hardcode "Ty" as requested in the prompt or use session user name if available.
  const name = session.user?.name?.split(' ')[0] || 'Ty';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pt-8 px-4 pb-24">
      <div className="max-w-3xl mx-auto w-full mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
          {greeting}, {name}.
        </h1>
        <p className="text-zinc-500 mt-2">
          Here is your operating system for today.
        </p>
      </div>

      <DayPlan />
    </div>
  );
}
