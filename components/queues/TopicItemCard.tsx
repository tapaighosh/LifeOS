'use client';

/**
 * TopicItemCard — Individual topic/problem item with accordion expand
 *
 * Features:
 * - Drag handle (≡) when draggable=true
 * - Difficulty badge (color-coded: emerald/amber/rose)
 * - Status icon indicator
 * - Accordion expand: shows notes textarea, covered date, DSA fields
 * - Inline save for field edits
 */

import { useState } from 'react';
import useSWR from 'swr';
import { GripVertical, ChevronDown, ChevronUp, Check, Minus, MoveRight, Circle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITopicItem } from '@/models/TopicItem';
import { INotebookTopic } from '@/models/NotebookTopic';
import { NewEntryDrawer } from '@/components/notebook/NewEntryDrawer';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TopicItemCardProps {
  item: ITopicItem & { _id: string };
  draggable?: boolean;
  isDsa?: boolean;
  onUpdate?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const difficultyStyles: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  hard: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
};

function StatusIcon({ status, skipCount }: { status: string; skipCount?: number }) {
  if (status === 'covered') return <Check className="w-4 h-4 text-emerald-400" />;
  if (status === 'in_progress') return <MoveRight className="w-4 h-4 text-indigo-400" />;
  if (status === 'skipped') return <Minus className="w-4 h-4 text-zinc-500" />;
  // pending with skip_count > 0 — subtle amber minus
  if (status === 'pending' && (skipCount ?? 0) > 0) return <Minus className="w-4 h-4 text-amber-500/80" />;
  return <Circle className="w-4 h-4 text-zinc-600" />;
}

export function TopicItemCard({
  item,
  draggable = false,
  isDsa = false,
  onUpdate,
  dragHandleProps,
}: TopicItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [approachNotes, setApproachNotes] = useState(item.approach_notes ?? '');
  const [timeTaken, setTimeTaken] = useState<string>(item.time_taken?.toString() ?? '');
  const [solvedWithout, setSolvedWithout] = useState(item.solved_without_hint ?? false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notebookDrawerOpen, setNotebookDrawerOpen] = useState(false);

  // Resolve the Learnings topic ID for the notebook shortcut
  const { data: topicsData } = useSWR<{ topics: INotebookTopic[] }>('/api/notebook/topics', fetcher);
  const learningsTopicId = topicsData?.topics.find((t) => t.title === 'Learnings')?._id?.toString();

  const isCovered = item.status === 'covered';

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { notes };
      if (isDsa) {
        payload.approach_notes = approachNotes;
        if (timeTaken) payload.time_taken = parseInt(timeTaken, 10);
        payload.solved_without_hint = solvedWithout;
      }

      await fetch(`/api/queues/${item.queue_id}/items/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setDirty(false);
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          'rounded-xl border transition-colors',
          isCovered
            ? 'bg-zinc-900/30 border-zinc-800/50'
            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        )}
      >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Drag handle */}
        {draggable && (
          <span
            {...dragHandleProps}
            className="shrink-0 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )}

        {/* Difficulty badge */}
        <span
          className={cn(
            'shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
            difficultyStyles[item.difficulty] ?? 'bg-zinc-800 text-zinc-400'
          )}
        >
          {item.difficulty[0]}
        </span>

        {/* Title + optional high-skip indicator */}
        <span
          className={cn(
            'flex-1 flex items-center gap-1.5 text-sm font-medium leading-snug',
            isCovered ? 'text-zinc-500 line-through' : 'text-zinc-200'
          )}
        >
          {item.title}
          {(item.skip_count ?? 0) >= 3 && !isCovered && (
            <span
              className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/70"
              title={`Skipped ${item.skip_count} times`}
            />
          )}
        </span>

        {/* Status + chevron */}
        <span className="shrink-0 flex items-center gap-1.5">
          <StatusIcon status={item.status} skipCount={item.skip_count ?? 0} />
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </span>
      </div>

      {/* Accordion panel */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60 pt-3">
          {/* Covered date + notebook shortcut */}
          {isCovered && item.covered_on && (
            <div>
              <p className="text-xs text-zinc-500">
                Covered on <span className="text-zinc-400">{item.covered_on}</span>
                {item.next_revision && (
                  <> · Revision due <span className="text-indigo-400">{item.next_revision}</span></>
                )}
              </p>
              {learningsTopicId && (
                <button
                  onClick={() => setNotebookDrawerOpen(true)}
                  className="mt-2 text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" /> Save to Notebook
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
              placeholder="Add notes…"
              rows={3}
              className="w-full text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* DSA-specific fields */}
          {isDsa && (
            <>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Approach notes</label>
                <textarea
                  value={approachNotes}
                  onChange={(e) => { setApproachNotes(e.target.value); setDirty(true); }}
                  placeholder="How did you approach it?"
                  rows={2}
                  className="w-full text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 block mb-1">Time taken (min)</label>
                  <input
                    type="number"
                    value={timeTaken}
                    min={1}
                    max={300}
                    onChange={(e) => { setTimeTaken(e.target.value); setDirty(true); }}
                    className="w-full text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={solvedWithout}
                      onChange={(e) => { setSolvedWithout(e.target.checked); setDirty(true); }}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                    />
                    <span className="text-xs text-zinc-400">Solved without hint</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      )}
    </div>

    {/* Save to Notebook drawer — only when a covered item triggers it */}
    {notebookDrawerOpen && learningsTopicId && (
      <NewEntryDrawer
        topicId={learningsTopicId}
        topicName="Learnings"
        isOpen={notebookDrawerOpen}
        onClose={() => setNotebookDrawerOpen(false)}
        onAdded={() => setNotebookDrawerOpen(false)}
        prefillSource={item.title}
      />
    )}
    </>
  );
}
