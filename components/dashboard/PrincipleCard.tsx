'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrincipleCardProps {
  heading: string;
  body: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PrincipleCard
 *
 * Displays today's rotating principle with a collapsible body.
 * Body text longer than 100 characters gets clamped to 2 lines;
 * the user can expand/collapse via a "Read more" / "Show less" toggle.
 */
export function PrincipleCard({ heading, body }: PrincipleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 100;

  return (
    <div
      className={[
        'bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4',
        'border-l-2 border-l-indigo-500/60',
      ].join(' ')}
    >
      {/* Label */}
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        Today's Principle
      </p>

      {/* Heading */}
      <p className="text-sm font-semibold text-zinc-100 mb-1">{heading}</p>

      {/* Body — clamped unless expanded */}
      <p
        className={[
          'text-sm text-zinc-400 leading-relaxed transition-all',
          !expanded && isLong ? 'line-clamp-2' : '',
        ].join(' ')}
      >
        {body}
      </p>

      {/* Toggle — only rendered when body is long enough */}
      {isLong && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * PrincipleCardSkeleton
 *
 * Animate-pulse placeholder shown while the SWR fetch is in-flight.
 * Mirrors the dimensions of PrincipleCard so the layout doesn't shift.
 */
export function PrincipleCardSkeleton() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4 border-l-2 border-l-indigo-500/30 animate-pulse">
      {/* Label placeholder */}
      <div className="h-3 w-28 bg-zinc-800 rounded mb-3" />
      {/* Heading placeholder */}
      <div className="h-4 w-48 bg-zinc-800 rounded mb-2" />
      {/* Body placeholder — two lines */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-800/70 rounded" />
        <div className="h-3 w-3/4 bg-zinc-800/70 rounded" />
      </div>
    </div>
  );
}
