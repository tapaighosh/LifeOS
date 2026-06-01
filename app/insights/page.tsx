'use client';

import { useEffect, useState } from 'react';
import { WeeklyData } from '@/lib/insights/weeklyAggregator';
import { WeeklyReviewInsight } from '@/lib/ai/weeklyReview';
import { PillarChart } from '@/components/insights/PillarChart';
import { StreakBadge } from '@/components/insights/StreakBadge';
import { EnergyTrend } from '@/components/insights/EnergyTrend';
import { WeekSummary } from '@/components/insights/WeekSummary';
import { AIReviewCard } from '@/components/insights/AIReviewCard';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

interface WeeklyInsightsResponse extends WeeklyData {
  aiInsight: WeeklyReviewInsight | null;
}

export default function InsightsPage() {
  const [data, setData] = useState<WeeklyInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/insights/weekly');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex justify-center">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-zinc-400">
        Failed to load insights.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in space-y-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Weekly Review</h1>
          <p className="text-zinc-400 mt-1">
            {new Date(data.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {new Date(data.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchInsights} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      {data.aiInsight && (
        <AIReviewCard 
          observation={data.aiInsight.observation} 
          recommendation={data.aiInsight.recommendation} 
        />
      )}

      <div className="flex flex-wrap gap-3">
        {(Object.keys(data.pillarStreaks) as Array<keyof typeof data.pillarStreaks>).map(pillar => (
          data.pillarStreaks[pillar] > 0 && (
            <StreakBadge key={pillar} pillar={pillar} count={data.pillarStreaks[pillar]} />
          )
        ))}
      </div>

      <WeekSummary 
        completionRate={data.completionRate} 
        rechargeCompliance={data.rechargeCompliance} 
        totalTasksDone={data.totalTasksDone}
        totalTasksScheduled={data.totalTasksScheduled}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PillarChart balance={data.pillarBalance} />
        <EnergyTrend energyByDay={data.energyByDay} />
      </div>

      {/* Queue Stats */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Learning Queue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Topics Covered', value: data.queueStats.topicsCoveredThisWeek },
            { label: 'DSA Solved', value: data.queueStats.dsaSolvedThisWeek },
            { label: 'Revisions Due', value: data.queueStats.revisionsDue, highlight: data.queueStats.revisionsDue > 0 },
            { label: 'Active Queues', value: data.queueStats.activeQueues },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${ highlight ? 'text-amber-400' : 'text-zinc-100' }`}>{value}</p>
              <p className="text-xs text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Neglected Pillars */}
      {data.neglectedPillars.length > 0 && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Needs Attention</h2>
          <p className="text-sm text-zinc-300 mb-3">
            The following pillars represent less than 15% of your completed work this week:
          </p>
          <div className="flex gap-2 flex-wrap">
            {data.neglectedPillars.map((p: string) => (
              <span
                key={p}
                className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium capitalize"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
