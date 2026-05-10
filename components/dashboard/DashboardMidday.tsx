'use client';

import { useState } from 'react';
import { Sun, Plus } from 'lucide-react';
import { DayPlan } from '@/components/plan/DayPlan';
import AddToTodayDrawer from '@/components/dashboard/AddToTodayDrawer';

interface Props {
  userName: string;
}

export default function DashboardMidday({ userName }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Sun className="h-6 w-6 text-amber-400" />
            Good afternoon, {userName}.
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{today}</p>
        </div>

        {/* Plan */}
        <div className="space-y-3">
          <DayPlan />

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add to Today
          </button>
        </div>
      </div>

      {drawerOpen && (
        <AddToTodayDrawer
          planTaskIds={[]}
          onClose={() => setDrawerOpen(false)}
          onAdded={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
