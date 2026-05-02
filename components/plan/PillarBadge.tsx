import { cn } from '@/lib/utils';

interface PillarBadgeProps {
  pillar: 'money' | 'soul' | 'curiosity';
  className?: string;
}

const PILLAR_CONFIG = {
  money: { icon: '💰', text: 'Money', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  soul: { icon: '🔥', text: 'Soul', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  curiosity: { icon: '🧠', text: 'Curiosity', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
};

export function PillarBadge({ pillar, className }: PillarBadgeProps) {
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.money;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.color,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}
