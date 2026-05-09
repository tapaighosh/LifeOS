import { WeeklyData } from '@/lib/insights/weeklyAggregator';
import { cn } from '@/lib/utils';

interface PillarChartProps {
  balance: WeeklyData['pillarBalance'];
}

export function PillarChart({ balance }: PillarChartProps) {
  const pillars = [
    { key: 'money', label: 'Money', pct: balance.money.pct, color: 'bg-emerald-500' },
    { key: 'soul', label: 'Soul', pct: balance.soul.pct, color: 'bg-rose-500' },
    { key: 'curiosity', label: 'Curiosity', pct: balance.curiosity.pct, color: 'bg-sky-500' },
  ];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">Pillar Balance</h3>
      <div className="space-y-4">
        {pillars.map(p => (
          <div key={p.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{p.label}</span>
              <span className="font-medium text-zinc-200">{p.pct}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className={cn("h-full transition-all duration-1000", p.color)} 
                style={{ width: `${p.pct}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pillars.filter(p => p.pct < 15).map(p => (
          <span key={p.key} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {p.label} Neglected
          </span>
        ))}
      </div>
    </div>
  );
}
