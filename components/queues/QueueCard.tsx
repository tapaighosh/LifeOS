'use client';

/**
 * QueueCard — Summary card for a single topic queue
 *
 * Shows: name, pillar badge, queue type icon, progress bar, covered/total counter.
 * Glassmorphism style consistent with the rest of the LifeOS design system.
 * Entire card is a Link to the queue detail page.
 */

import Link from 'next/link';
import { BookOpen, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITopicQueue } from '@/models/TopicQueue';

interface QueueProgress {
  covered: number;
  pending: number;
  skipped: number;
  in_progress: number;
  total: number;
}

interface QueueCardProps {
  queue: ITopicQueue & { _id: string };
  progress: QueueProgress;
}

const pillarBadgeStyles: Record<string, string> = {
  money: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  curiosity: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  soul: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};

const pillarBarFill: Record<string, string> = {
  money: 'bg-amber-400',
  curiosity: 'bg-blue-400',
  soul: 'bg-rose-400',
};

export function QueueCard({ queue, progress }: QueueCardProps) {
  const pct = progress.total > 0 ? Math.round((progress.covered / progress.total) * 100) : 0;
  const isDsa = queue.queue_type === 'dsa';

  return (
    <Link
      href={`/queues/${queue._id}`}
      className="block group"
    >
      <div
        className={cn(
          'relative rounded-2xl p-5 transition-all duration-200 cursor-pointer',
          'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800',
          'hover:border-zinc-600 hover:scale-[1.01] hover:shadow-lg hover:shadow-zinc-950/40'
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {/* Queue type icon */}
            <span className="shrink-0 w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {isDsa ? (
                <Code2 className="w-4 h-4 text-zinc-300" />
              ) : (
                <BookOpen className="w-4 h-4 text-zinc-300" />
              )}
            </span>

            {/* Name */}
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100 text-sm truncate leading-tight">
                {queue.name}
              </h3>
              {queue.description && (
                <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{queue.description}</p>
              )}
            </div>
          </div>

          {/* Pillar badge */}
          <span
            className={cn(
              'shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5',
              pillarBadgeStyles[queue.pillar] ?? 'bg-zinc-800 text-zinc-400'
            )}
          >
            {queue.pillar}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                pillarBarFill[queue.pillar] ?? 'bg-indigo-400'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Counts row */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            <span className="text-zinc-300 font-medium">{progress.covered}</span>
            <span> / {progress.total} covered</span>
          </span>
          {progress.in_progress > 0 && (
            <span className="text-indigo-400 font-medium">In progress</span>
          )}
          <span className="text-zinc-600">{pct}%</span>
        </div>
      </div>
    </Link>
  );
}
