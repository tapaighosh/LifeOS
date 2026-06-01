'use client';

/**
 * RevisionQueueWidget
 *
 * Surfaces today's due revisions on the dashboard.
 * Each item shows the title, how many days overdue (if any),
 * and cycle progress (e.g. "2 / 4 — next in 7 days").
 *
 * Design: same card shell as the rest of the dashboard —
 *   bg-zinc-900/50 border border-zinc-800/60 rounded-2xl
 * Left accent: amber — revisions belong to the Memory / Mastery layer.
 */

import useSWR from 'swr';
import { Brain, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RevisionItem {
  _id: string;
  original_title: string;
  learned_on: string;
  next_revision: string;
  cycle_index: number;
  progress: string;
}

interface RevisionQueueResponse {
  items: RevisionItem[];
  total: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CYCLE_LABELS: Record<number, string> = {
  1: 'Day 1 review',
  2: 'Day 3 review',
  3: 'Day 7 review',
  4: 'Day 14 review — mastered',
};

function daysOverdue(nextRevision: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextRevision);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function RevisionItemRow({ item }: { item: RevisionItem }) {
  const overdue = daysOverdue(item.next_revision);
  const label = CYCLE_LABELS[item.cycle_index] ?? `Cycle ${item.cycle_index}`;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/40 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{item.original_title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
      <div className="shrink-0 text-right ml-3">
        {overdue > 0 ? (
          <span className="text-xs font-semibold text-amber-400">
            {overdue}d overdue
          </span>
        ) : (
          <span className="text-xs text-emerald-400">Due today</span>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/40 last:border-0 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3.5 w-36 bg-zinc-800/60 rounded" />
        <div className="h-3 w-20 bg-zinc-800/40 rounded" />
      </div>
      <div className="h-3 w-14 bg-zinc-800/40 rounded" />
    </div>
  );
}

export function RevisionQueueWidget() {
  const { data, isLoading } = useSWR<RevisionQueueResponse>('/api/revision/queue', fetcher, {
    refreshInterval: 0,
  });

  // Hide the widget if loaded and nothing is due
  if (!isLoading && data && data.items.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4',
        'border-l-2 border-l-amber-500/60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Revision Queue
          </span>
        </div>
        {data && data.total > 0 && (
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            {data.total} due
          </span>
        )}
      </div>

      {/* Rows */}
      <div>
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          data?.items.map((item) => <RevisionItemRow key={item._id} item={item} />)
        )}
      </div>

      {/* Footer CTA */}
      {!isLoading && data && data.total > 0 && (
        <Link
          href="/revision"
          className="mt-3 flex items-center gap-1 text-xs text-amber-400 hover:underline"
        >
          View all revisions <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
