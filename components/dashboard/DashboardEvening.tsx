'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Moon, CheckCircle, Plus, CheckSquare, X } from 'lucide-react';
import { DayPlan } from '@/components/plan/DayPlan';
import TomorrowPreview from '@/components/dashboard/TomorrowPreview';
import AddToTodayDrawer from '@/components/dashboard/AddToTodayDrawer';

interface EveningData {
  todaySummary: {
    totalScheduled: number;
    totalDone: number;
    totalSkipped: number;
    pillarBreakdown: { money: number; soul: number; curiosity: number };
  };
  checkinDone: boolean;
  challengeWins: {
    _id: string;
    title: string;
    current_streak: number;
    status: string;
  }[];
  tomorrowPreview: any[];
}

interface Props {
  data: EveningData | undefined;
  userName: string;
}

const PILLAR_COLOR: Record<string, string> = {
  money: 'bg-amber-500',
  soul: 'bg-rose-500',
  curiosity: 'bg-blue-500',
};

export default function DashboardEvening({ data, userName }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const total = data?.todaySummary.totalScheduled ?? 0;
  const done = data?.todaySummary.totalDone ?? 0;
  const breakdown = data?.todaySummary.pillarBreakdown;

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

        {/* ─ 1. Greeting ─ */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Moon className="h-6 w-6 text-indigo-400" />
            Good evening, {userName}.
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{today}</p>
        </div>

        {/* ─ 2. Check-In CTA ─ */}
        <div className={`rounded-2xl border p-5 ${data?.checkinDone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/10'}`}>
          {data?.checkinDone ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Check-in complete ✓</p>
                <p className="text-xs text-zinc-500 mt-0.5">Your day has been logged and challenges updated.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-100">Ready to close the day?</p>
                <p className="text-xs text-zinc-500 mt-0.5">Log your tasks and reflect on what worked.</p>
              </div>
              <Link
                href="/checkin"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
              >
                Start Check-In
              </Link>
            </div>
          )}
        </div>

        {/* ─ 3. Today's Summary ─ */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Today's Summary
          </h2>

          {!data ? (
            <div className="h-8 bg-zinc-800/50 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-zinc-100">
                {done}
                <span className="text-zinc-500 text-base font-normal">/{total} tasks</span>
              </p>

              {/* Mini pillar bars */}
              {breakdown && total > 0 && (
                <div className="space-y-2 pt-1">
                  {(['money', 'soul', 'curiosity'] as const).map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-16 capitalize">{p}</span>
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full">
                        <div
                          className={`h-full rounded-full ${PILLAR_COLOR[p]}/60`}
                          style={{ width: `${total > 0 ? (breakdown[p] / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-4">{breakdown[p]}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ─ 4. Challenge Wins ─ */}
        {(data?.challengeWins?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Challenge Wins</h2>
            {data!.challengeWins.map((cw) => (
              <div key={cw._id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
                {cw.status === 'done' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-zinc-600 shrink-0" />
                )}
                <span className="flex-1 text-sm text-zinc-200 truncate">{cw.title}</span>
                {cw.status === 'done' && cw.current_streak > 0 && (
                  <span className="text-xs text-orange-400">🔥 {cw.current_streak}</span>
                )}
                {cw.status !== 'done' && (
                  <span className="text-xs text-zinc-500">not done yet</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─ 5. Tomorrow Preview ─ */}
        {data?.tomorrowPreview && <TomorrowPreview tasks={data.tomorrowPreview} />}

        {/* ─ Plan + Add ─ */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today's Plan</h2>
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
