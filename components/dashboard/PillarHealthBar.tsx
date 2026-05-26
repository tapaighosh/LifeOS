'use client';

import { AlertTriangle } from 'lucide-react';

const PILLAR_CONFIG = {
  money:     { label: '💰 Money',     color: 'bg-amber-500', text: 'text-amber-400' },
  soul:      { label: '🔥 Soul',      color: 'bg-rose-500',  text: 'text-rose-400'  },
  curiosity: { label: '🧠 Curiosity', color: 'bg-blue-500',  text: 'text-blue-400'  },
} as const;

interface Props {
  pillar: 'money' | 'soul' | 'curiosity';
  count: number;
  target: number;  // % target from settings (e.g. 40)
  total: number;   // total done tasks this week across all pillars
}

export default function PillarHealthBar({ pillar, count, target, total }: Props) {
  const cfg = PILLAR_CONFIG[pillar];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const neglected = total > 0 && pct < 15;

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="text-xs font-medium text-zinc-400 w-20 shrink-0">
        {cfg.label}
      </span>

      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.color}/70`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Count + warning */}
      <div className="flex items-center gap-1 w-16 justify-end shrink-0">
        <span className={`text-xs font-medium ${cfg.text}`}>
          {count} task{count !== 1 ? 's' : ''}
        </span>
        {neglected && (
          <span title="Neglected pillar"><AlertTriangle className="h-3 w-3 text-amber-400" /></span>
        )}
      </div>
    </div>
  );
}
