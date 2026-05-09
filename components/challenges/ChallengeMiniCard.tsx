'use client';

import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

const CATEGORY_COLOR: Record<string, string> = {
  physical:  'bg-rose-500/60',
  mental:    'bg-indigo-500/60',
  financial: 'bg-amber-500/60',
  social:    'bg-emerald-500/60',
  creative:  'bg-purple-500/60',
};

interface MiniChallenge {
  _id: string;
  title: string;
  category: string;
  target_type: 'streak' | 'total_count' | 'milestone';
  target_value: number;
  total_completed: number;
  current_streak: number;
}

interface Props {
  challenge: MiniChallenge;
}

export default function ChallengeMiniCard({ challenge }: Props) {
  const router = useRouter();
  const barColor = CATEGORY_COLOR[challenge.category] ?? 'bg-zinc-500/60';

  const progress =
    challenge.target_type === 'milestone'
      ? 0
      : Math.min(Math.round((challenge.total_completed / challenge.target_value) * 100), 100);

  const progressLabel =
    challenge.target_type === 'streak'
      ? `${challenge.total_completed}/${challenge.target_value} days`
      : challenge.target_type === 'total_count'
      ? `${challenge.total_completed}/${challenge.target_value}`
      : 'In progress';

  return (
    <button
      onClick={() => router.push('/challenges')}
      className="w-full text-left rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-3 transition-all duration-200 hover:bg-zinc-900/90 hover:border-zinc-700 active:scale-[0.98]"
    >
      <p className="text-xs font-medium text-zinc-200 leading-tight truncate mb-2">
        {challenge.title}
      </p>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{progressLabel}</span>
        {challenge.target_type === 'streak' && challenge.current_streak > 0 && (
          <span className="flex items-center gap-0.5 text-orange-400">
            <Flame className="h-3 w-3" />
            {challenge.current_streak}
          </span>
        )}
      </div>
    </button>
  );
}
