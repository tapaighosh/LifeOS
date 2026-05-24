'use client';

/**
 * /queues/[queue_id] — Queue detail page (Client Component)
 *
 * Three tabs: Pending | Covered | Skipped
 * - Pending/Skipped tabs: draggable QueueItemList
 * - Covered tab: locked list (no drag), shows covered_on date
 * - Fixed bottom "+ Add Topic" button opens AddTopicDrawer
 */

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, BookOpen, Code2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QueueItemList } from '@/components/queues/QueueItemList';
import { TopicItemCard } from '@/components/queues/TopicItemCard';
import { AddTopicDrawer } from '@/components/queues/AddTopicDrawer';
import { ITopicItem } from '@/models/TopicItem';
import { ITopicQueue } from '@/models/TopicQueue';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = 'pending' | 'covered' | 'skipped';

const TAB_LABELS: Record<Tab, string> = {
  pending: 'Pending',
  covered: 'Covered ✓',
  skipped: 'Skipped',
};

const pillarBadgeStyles: Record<string, string> = {
  money: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  curiosity: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  soul: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const pillarBarFill: Record<string, string> = {
  money: 'bg-amber-400',
  curiosity: 'bg-blue-400',
  soul: 'bg-rose-400',
};

export default function QueueDetailPage() {
  const params = useParams<{ queue_id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, mutate, isLoading } = useSWR<{
    queue: ITopicQueue & { _id: string };
    items: (ITopicItem & { _id: string })[];
  }>(`/api/queues/${params.queue_id}?tab=${tab}`, fetcher);

  // Fetch progress bar data from "all" tab lazily (always call before early returns!)
  const { data: allData } = useSWR<{
    queue: ITopicQueue & { _id: string };
    items: (ITopicItem & { _id: string })[];
  }>(`/api/queues/${params.queue_id}?tab=all`, fetcher);

  // Refetch on any update
  const handleUpdate = useCallback(() => { mutate(); }, [mutate]);

  if (isLoading || !data) {
    return (
      <main className="max-w-2xl mx-auto pb-28 px-4 pt-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl mb-2 animate-pulse" />
        ))}
      </main>
    );
  }

  if ('error' in data || !data.queue) {
    return (
      <main className="max-w-2xl mx-auto pb-28 px-4 pt-6 text-center text-zinc-400 mt-10">
        <p>{(data as any).error || 'Queue not found.'}</p>
        <button onClick={() => router.push('/queues')} className="text-indigo-400 text-sm mt-4 hover:text-indigo-300">
          Return to Queues
        </button>
      </main>
    );
  }

  const { queue, items } = data;

  // Compute total + covered across all statuses by fetching progress separately
  // For now, we show tab-filtered counts
  const isDsa = queue.queue_type === 'dsa';

  const totalItems = allData?.items.length ?? 0;
  const coveredCount = allData?.items.filter((i) => i.status === 'covered').length ?? 0;
  const progressPct = totalItems > 0 ? Math.round((coveredCount / totalItems) * 100) : 0;

  return (
    <main className="max-w-2xl mx-auto pb-32 px-4 pt-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push('/queues')}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Queues
      </button>

      {/* Queue header */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {isDsa ? (
              <Code2 className="w-5 h-5 text-zinc-400" />
            ) : (
              <BookOpen className="w-5 h-5 text-zinc-400" />
            )}
            <h1 className="text-xl font-bold text-zinc-100">{queue.name}</h1>
          </div>
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
              pillarBadgeStyles[queue.pillar] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
            )}
          >
            {queue.pillar}
          </span>
        </div>

        {queue.description && (
          <p className="text-zinc-500 text-sm mb-3">{queue.description}</p>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span><span className="text-zinc-300 font-medium">{coveredCount}</span> / {totalItems} covered</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', pillarBarFill[queue.pillar] ?? 'bg-indigo-400')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 mb-5">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
              tab === t
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'covered' ? (
        // Covered tab — no drag handles
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">
              No covered topics yet.
            </div>
          ) : (
            items.map((item) => (
              <TopicItemCard
                key={item._id}
                item={item}
                draggable={false}
                isDsa={isDsa}
                onUpdate={handleUpdate}
              />
            ))
          )}
        </div>
      ) : (
        // Pending / Skipped — draggable
        <QueueItemList
          items={items}
          queueId={params.queue_id}
          isDsa={isDsa}
          onItemUpdated={handleUpdate}
        />
      )}

      {/* Add Topic button (fixed to bottom of screen) */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add {isDsa ? 'Problem' : 'Topic'}
        </button>
      </div>

      {/* Add topic drawer */}
      <AddTopicDrawer
        queueId={params.queue_id}
        queueType={queue.queue_type}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdded={handleUpdate}
      />
    </main>
  );
}
