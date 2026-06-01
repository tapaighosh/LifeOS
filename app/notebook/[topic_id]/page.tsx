'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { ArrowLeft, PenLine, Plus } from 'lucide-react';
import Link from 'next/link';
import { EntryCard } from '@/components/notebook/EntryCard';
import { NewEntryDrawer } from '@/components/notebook/NewEntryDrawer';
import { INotebookEntry } from '@/models/NotebookEntry';
import { INotebookTopic } from '@/models/NotebookTopic';

/**
 * /notebook/[topic_id] — Entries page (Client Component)
 *
 * Two SWR fetches:
 *   1. Entries for this topic  — /api/notebook/topics/[id]/entries
 *   2. Topic name + color       — /api/notebook/topics (find by id client-side)
 *
 * Entries are pre-sorted newest-first by the API.
 * Displayed in date groups: a sticky date label above each new date.
 */

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Date grouping helpers ─────────────────────────────────────────────────────

function toDateLabel(date: Date | string): string {
  const d     = new Date(date);
  const today = new Date();
  const yest  = new Date(Date.now() - 86_400_000);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yest))  return 'Yesterday';

  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/**
 * Groups a sorted (newest-first) array of entries into { label, entries[] } blocks.
 * One group per calendar day.
 */
function groupByDate(entries: INotebookEntry[]): { label: string; entries: INotebookEntry[] }[] {
  const groups: { label: string; entries: INotebookEntry[] }[] = [];
  let currentLabel = '';

  for (const entry of entries) {
    const label = toDateLabel(entry.created_at);
    if (label !== currentLabel) {
      groups.push({ label, entries: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].entries.push(entry);
  }

  return groups;
}

// ── Color map for the topic accent bar ───────────────────────────────────────

const COLOR_BAR: Record<string, string> = {
  amber:   'bg-amber-400',
  blue:    'bg-blue-400',
  rose:    'bg-rose-400',
  emerald: 'bg-emerald-400',
  indigo:  'bg-indigo-400',
  zinc:    'bg-zinc-500',
};

// ── Loading skeleton ─────────────────────────────────────────────────────────

function EntrySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-zinc-800/50 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NotebookEntriesPage() {
  const { topic_id } = useParams<{ topic_id: string }>();

  const entriesKey = `/api/notebook/topics/${topic_id}/entries`;

  const { data: entriesData, isLoading: entriesLoading } = useSWR<{
    entries: INotebookEntry[];
  }>(entriesKey, fetcher);

  // Fetch all topics to resolve the current topic's name and color
  const { data: topicsData } = useSWR<{ topics: INotebookTopic[] }>(
    '/api/notebook/topics',
    fetcher
  );

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [prefillSource, setPrefillSource] = useState('');

  // Resolve current topic
  const topic = topicsData?.topics.find(
    (t) => String(t._id) === topic_id
  );

  const entries   = entriesData?.entries ?? [];
  const dateGroups = groupByDate(entries);
  const accentBar  = COLOR_BAR[topic?.color ?? 'indigo'];

  function handleAdded() {
    mutate(entriesKey);
  }

  function handleEntryUpdated() {
    mutate(entriesKey);
  }

  function handleEntryDeleted() {
    mutate(entriesKey);
    // Also refresh topics list so entry_count stays in sync
    mutate('/api/notebook/topics');
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* ── Back nav + topic header ── */}
        <div className="space-y-4">
          <Link
            href="/notebook"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Notebook
          </Link>

          {/* Topic accent bar + title */}
          <div className="flex items-center gap-3">
            {/* Color accent dot */}
            <span className={`h-8 w-1.5 rounded-full shrink-0 ${accentBar}`} />

            <div className="flex-1 min-w-0">
              {topic ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{topic.icon}</span>
                    <h1 className="text-xl font-bold text-zinc-100 truncate">
                      {topic.title}
                    </h1>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 ml-9">
                    {topic.entry_count} {topic.entry_count === 1 ? 'entry' : 'entries'}
                  </p>
                </>
              ) : (
                <div className="h-7 w-40 bg-zinc-800/50 rounded-lg animate-pulse" />
              )}
            </div>

            {/* New entry button */}
            <button
              onClick={() => { setPrefillSource(''); setDrawerOpen(true); }}
              id="new-entry-btn"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Entry</span>
            </button>
          </div>
        </div>

        {/* ── Entry list ── */}
        {entriesLoading ? (
          <EntrySkeleton />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PenLine className="h-10 w-10 text-zinc-700 mb-4" />
            <p className="text-sm text-zinc-400 font-medium">No entries yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Write your first one.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.label}>
                {/* Date group label */}
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  {group.label}
                </p>

                <div className="flex flex-col gap-3">
                  {group.entries.map((entry) => (
                    <EntryCard
                      key={String(entry._id)}
                      entry={entry}
                      onUpdated={handleEntryUpdated}
                      onDeleted={handleEntryDeleted}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── New Entry Drawer ── */}
      <NewEntryDrawer
        topicId={topic_id}
        topicName={topic?.title ?? 'Topic'}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdded={handleAdded}
        prefillSource={prefillSource}
      />
    </div>
  );
}
