import Link from 'next/link';
import { Pin } from 'lucide-react';
import { INotebookTopic } from '@/models/NotebookTopic';

/**
 * NotebookTopicCard
 *
 * Pure display card — no interactivity, safe to render as a Server Component.
 * Links to /notebook/[topic._id] where entries are listed.
 */

// Tailwind color map for the left accent border.
// Full class strings are required so Tailwind's content scanner keeps them.
const COLOR_BORDER: Record<string, string> = {
  amber:   'border-l-amber-400',
  blue:    'border-l-blue-400',
  rose:    'border-l-rose-400',
  emerald: 'border-l-emerald-400',
  indigo:  'border-l-indigo-400',
  zinc:    'border-l-zinc-500',
};

// Badge background used for the entry count chip
const COLOR_BADGE: Record<string, string> = {
  amber:   'bg-amber-500/10 text-amber-400',
  blue:    'bg-blue-500/10 text-blue-400',
  rose:    'bg-rose-500/10 text-rose-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  indigo:  'bg-indigo-500/10 text-indigo-400',
  zinc:    'bg-zinc-700/40 text-zinc-400',
};

/** Returns a human-readable relative date label for last_entry_on. */
function relativeDate(last_entry_on: string | null): string {
  if (!last_entry_on) return 'No entries yet';

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  if (last_entry_on === today)     return 'today';
  if (last_entry_on === yesterday) return 'yesterday';

  // Fallback: format as "15 May 2025"
  return new Date(last_entry_on).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface NotebookTopicCardProps {
  topic: INotebookTopic;
}

export function NotebookTopicCard({ topic }: NotebookTopicCardProps) {
  const borderColor = COLOR_BORDER[topic.color] ?? COLOR_BORDER.indigo;
  const badgeColor  = COLOR_BADGE[topic.color]  ?? COLOR_BADGE.indigo;
  const dateLabel   = relativeDate(topic.last_entry_on);

  return (
    <Link
      href={`/notebook/${topic._id}`}
      className={[
        // Base card
        'block bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-4',
        // Left accent border
        'border-l-2', borderColor,
        // Hover effects
        'transition-all hover:scale-[1.01] hover:border-zinc-600',
      ].join(' ')}
    >
      {/* ── Top row: icon + title + pin ── */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl shrink-0" aria-hidden="true">
          {topic.icon}
        </span>

        <span className="flex-1 text-sm font-semibold text-zinc-100 truncate">
          {topic.title}
        </span>

        {topic.pinned && (
          <Pin
            className="h-3.5 w-3.5 shrink-0 text-zinc-500 fill-zinc-500"
            aria-label="Pinned"
          />
        )}
      </div>

      {/* ── Bottom row: entry count + relative date ── */}
      <div className="flex items-center gap-2 mt-2.5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
          {topic.entry_count} {topic.entry_count === 1 ? 'entry' : 'entries'}
        </span>

        <span className="text-xs text-zinc-500">·</span>

        <span className="text-xs text-zinc-500 truncate">
          {topic.entry_count === 0
            ? dateLabel
            : `Last: ${dateLabel}`}
        </span>
      </div>
    </Link>
  );
}
