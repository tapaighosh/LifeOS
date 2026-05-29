'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Sparkles, Plus, Zap, Trophy } from 'lucide-react';
import { DayPlan } from '@/components/plan/DayPlan';
import ChallengeMiniCard from '@/components/challenges/ChallengeMiniCard';
import PillarHealthBar from '@/components/dashboard/PillarHealthBar';
import AddToTodayDrawer from '@/components/dashboard/AddToTodayDrawer';
import { PrincipleCard, PrincipleCardSkeleton } from '@/components/dashboard/PrincipleCard';

interface PillarWeekData {
  count: number;
  target: number;
}

interface MorningData {
  plan: any;
  activeChallenges: any[];
  pillarWeek: {
    money: PillarWeekData;
    soul: PillarWeekData;
    curiosity: PillarWeekData;
  };
  energyForecast: 'low' | 'moderate' | 'high' | null;
  suggestedPillar: string;
}

interface Props {
  data: MorningData | undefined;
  userName: string;
}

const ENERGY_CONFIG = {
  low:      { label: 'Low',      color: 'text-rose-400', tip: 'Start with something light.' },
  moderate: { label: 'Moderate', color: 'text-amber-400', tip: 'Pace yourself — mix heavy and light.' },
  high:     { label: 'High',     color: 'text-emerald-400', tip: 'Great day for deep work.' },
};

const PILLAR_EMOJI: Record<string, string> = { money: 'Money', soul: 'Soul', curiosity: 'Curiosity' };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardMorning({ data, userName }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: principleData } = useSWR<{
    principle: { heading: string; body: string } | null;
  }>('/api/principles/today', fetcher);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const planTaskIds = data?.plan?.plan
    ?.filter((e: any) => e.entry_type !== 'recharge')
    .map((e: any) => e.task_id?.toString()) ?? [];

  const totalWeekDone =
    (data?.pillarWeek.money.count ?? 0) +
    (data?.pillarWeek.soul.count ?? 0) +
    (data?.pillarWeek.curiosity.count ?? 0);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

        {/* ─ 1. Greeting ─ */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Good morning, {userName}.
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{today}</p>
        </div>

        {/* ─ 2. Today's Principle ─ */}
        {principleData === undefined ? (
          <PrincipleCardSkeleton />
        ) : principleData.principle ? (
          <PrincipleCard
            heading={principleData.principle.heading}
            body={principleData.principle.body}
          />
        ) : null}

        {/* ─ 3. Energy Forecast ─ */}
        {data?.energyForecast && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Energy Forecast</span>
            </div>
            <p className="text-sm text-zinc-300">
              Based on last 3 days:{' '}
              <span className={`font-semibold ${ENERGY_CONFIG[data.energyForecast].color}`}>
                {ENERGY_CONFIG[data.energyForecast].label}
              </span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {ENERGY_CONFIG[data.energyForecast].tip}
              {data.suggestedPillar && (
                <span> Try {PILLAR_EMOJI[data.suggestedPillar]} {data.suggestedPillar} tasks first.</span>
              )}
            </p>
          </div>
        )}

        {/* ─ 3. Today's Plan ─ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Today's Plan
            </h2>
          </div>

          <DayPlan />

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add to Today
          </button>
        </div>

        {/* ─ 4. Active Challenges Widget ─ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Active Challenges
            </h2>
            <Link href="/challenges" className="text-xs text-indigo-400 hover:underline">
              View all →
            </Link>
          </div>

          {!data ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : data.activeChallenges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center">
              <p className="text-xs text-zinc-500">No active challenges.</p>
              <Link href="/challenges" className="text-xs text-indigo-400 hover:underline mt-1 block">
                Pick one →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.activeChallenges.map((c) => (
                <ChallengeMiniCard key={String(c._id)} challenge={c} />
              ))}
            </div>
          )}
        </div>

        {/* ─ 5. Pillar Health ─ */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            This Week's Pillars
          </h2>
          {!data ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-zinc-800/50 rounded animate-pulse" />)}
            </div>
          ) : (
            (['money', 'soul', 'curiosity'] as const).map((pillar) => (
              <PillarHealthBar
                key={pillar}
                pillar={pillar}
                count={data.pillarWeek[pillar].count}
                target={data.pillarWeek[pillar].target}
                total={totalWeekDone}
              />
            ))
          )}
        </div>
      </div>

      {drawerOpen && (
        <AddToTodayDrawer
          planTaskIds={planTaskIds}
          onClose={() => setDrawerOpen(false)}
          onAdded={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
