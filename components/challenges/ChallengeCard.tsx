'use client';

import { IChallenge } from '@/models/Challenge';
import { Trophy, Flame, Target, Mountain } from 'lucide-react';

// ─── Category colors ──────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  physical:  { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  mental:    { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  financial: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  social:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  creative:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
};

const TYPE_ICON = {
  streak:      <Flame className="h-3.5 w-3.5" />,
  total_count: <Target className="h-3.5 w-3.5" />,
  milestone:   <Mountain className="h-3.5 w-3.5" />,
};

// ─── Progress calculation ─────────────────────────────────────────────────────

function getProgress(challenge: IChallenge): number {
  if (challenge.target_type === 'milestone') {
    return challenge.status === 'completed' ? 100 : 0;
  }
  return Math.min(
    Math.round((challenge.total_completed / challenge.target_value) * 100),
    100
  );
}

function getProgressLabel(challenge: IChallenge): string {
  if (challenge.target_type === 'milestone') {
    return challenge.status === 'completed' ? 'Completed' : 'In progress';
  }
  if (challenge.target_type === 'streak') {
    return `Day ${challenge.total_completed} of ${challenge.target_value}`;
  }
  return `${challenge.total_completed} of ${challenge.target_value}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  challenge: IChallenge;
}

export default function ChallengeCard({ challenge }: Props) {
  const catStyle = CATEGORY_STYLES[challenge.category] ?? CATEGORY_STYLES.mental;
  const progress = getProgress(challenge);
  const progressLabel = getProgressLabel(challenge);

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border p-5
      bg-zinc-900/60 backdrop-blur-md transition-all duration-300
      hover:bg-zinc-900/80 hover:scale-[1.01] cursor-default
      ${catStyle.border}
    `}>
      {/* Category glow accent */}
      <div className={`absolute top-0 left-0 h-1 w-full ${catStyle.bg.replace('/10', '/40')}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-100 text-sm leading-tight truncate">
            {challenge.title}
          </h3>
          {challenge.last_completed_on && (
            <p className="text-xs text-zinc-500 mt-0.5">
              Last done:{' '}
              {new Date(challenge.last_completed_on).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>

        {/* Category + type badge */}
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${catStyle.bg} ${catStyle.text} ${catStyle.border} border shrink-0`}>
          {TYPE_ICON[challenge.target_type]}
          <span className="capitalize">{challenge.category}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
          <span>{progressLabel}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${catStyle.bg.replace('/10', '/70')}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Streak info (streak challenges only) */}
      {challenge.target_type === 'streak' && (
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span>
            Streak:{' '}
            <span className="text-zinc-200 font-medium">{challenge.current_streak} days</span>
          </span>
          <span className="text-zinc-600 mx-1">·</span>
          <Trophy className="h-3 w-3 text-amber-400" />
          <span>
            Best:{' '}
            <span className="text-zinc-200 font-medium">{challenge.best_streak} days</span>
          </span>
        </div>
      )}

      {/* Completed badge */}
      {challenge.status === 'completed' && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <Trophy className="h-3.5 w-3.5" />
          Challenge completed!
        </div>
      )}
    </div>
  );
}
