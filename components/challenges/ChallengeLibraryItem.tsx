'use client';

import { LibraryChallenge } from '@/lib/challenges/library';
import { CheckCircle, Flame, Target, Mountain, ChevronRight } from 'lucide-react';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  physical:  { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  mental:    { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  financial: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  social:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  creative:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
};

const TYPE_SUMMARY: Record<string, (val: number) => string> = {
  streak:      (v) => `${v}-day streak`,
  total_count: (v) => `${v} total completions`,
  milestone:   ()  => 'One-time milestone',
};

const TYPE_ICON = {
  streak:      <Flame className="h-3.5 w-3.5" />,
  total_count: <Target className="h-3.5 w-3.5" />,
  milestone:   <Mountain className="h-3.5 w-3.5" />,
};

interface Props {
  item: LibraryChallenge & { already_accepted?: boolean };
  onAccept: (item: LibraryChallenge) => void;
}

export default function ChallengeLibraryItem({ item, onAccept }: Props) {
  const catStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.mental;

  return (
    <div className={`
      rounded-2xl border p-4 bg-zinc-900/50 backdrop-blur-sm
      transition-all duration-200 hover:bg-zinc-900/70
      ${catStyle.border}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category + type badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
              <span className="capitalize">{item.category}</span>
            </span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400`}>
              {TYPE_ICON[item.target_type]}
              {TYPE_SUMMARY[item.target_type](item.target_value)}
            </span>
          </div>

          <h3 className="font-semibold text-zinc-100 text-sm leading-tight mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0 mt-1">
          {item.already_accepted ? (
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1.5 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" />
              Active
            </div>
          ) : (
            <button
              onClick={() => onAccept(item)}
              className={`
                flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full
                transition-all duration-200 active:scale-95
                ${catStyle.bg} ${catStyle.text} border ${catStyle.border}
                hover:opacity-80
              `}
            >
              Accept
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
