import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  pillar: 'money' | 'soul' | 'curiosity';
  count: number;
}

const colors = {
  money: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  soul: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  curiosity: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

export function StreakBadge({ pillar, count }: StreakBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
      colors[pillar]
    )}>
      <Flame className="w-4 h-4" />
      <span className="capitalize">{pillar}: {count} day{count !== 1 ? 's' : ''}</span>
    </div>
  );
}
