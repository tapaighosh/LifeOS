'use client';

/**
 * Dashboard page — Time-Aware Client Component
 *
 * WHY CLIENT COMPONENT + SWR instead of server fetch:
 *   Next.js server components execute in UTC. A user in IST (UTC+5:30) at 11:30 PM
 *   would appear to the server as 18:00 UTC — landing in the "afternoon" view.
 *   The only reliable source of the user's local time is the browser.
 *
 *   Solution:
 *   1. Mark the page 'use client' so new Date().getHours() reads local time.
 *   2. Fetch dashboard data via SWR (client-side) for two reasons:
 *      a. SWR can be conditionally triggered based on the local hour (no wasteful
 *         morning API call at 9 PM).
 *      b. SWR revalidates automatically when the window regains focus — the dashboard
 *         stays fresh if a user returns after a browser break.
 *
 *   Auth redirect: useSession + useRouter replaces the server-side redirect.
 *   The session is available on client via the existing SessionProvider in Providers.tsx.
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import DashboardMorning from '@/components/dashboard/DashboardMorning';
import DashboardEvening from '@/components/dashboard/DashboardEvening';
import DashboardMidday from '@/components/dashboard/DashboardMidday';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TimeOfDay = 'morning' | 'midday' | 'evening';

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 12) return 'morning';
  if (hour >= 21) return 'evening';
  return 'midday';
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Read local time in the browser — this is the critical fix vs server-side
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    setTimeOfDay(getTimeOfDay(new Date().getHours()));

    // Re-check every 5 minutes in case the user crosses a boundary
    const id = setInterval(() => {
      setTimeOfDay(getTimeOfDay(new Date().getHours()));
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  // Fetch only the relevant API for the current time of day
  const { data: morningData } = useSWR(
    timeOfDay === 'morning' ? '/api/dashboard/morning' : null,
    fetcher,
    { refreshInterval: 60_000 }
  );
  const { data: eveningData } = useSWR(
    timeOfDay === 'evening' ? '/api/dashboard/evening' : null,
    fetcher,
    { refreshInterval: 30_000 }
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-400" />
      </div>
    );
  }

  const name = session?.user?.name?.split(' ')[0] || 'there';

  if (timeOfDay === 'morning') {
    return <DashboardMorning data={morningData} userName={name} />;
  }
  if (timeOfDay === 'evening') {
    return <DashboardEvening data={eveningData} userName={name} />;
  }
  return <DashboardMidday userName={name} />;
}
