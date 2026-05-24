import { IPlanEntry } from '@/models/DailyPlan';
import { PillarBadge } from './PillarBadge';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface TaskBlockProps {
  entry: IPlanEntry;
  isLocked: boolean;
}

const PILLAR_BORDERS = {
  money: 'border-l-amber-500',
  soul: 'border-l-rose-500',
  curiosity: 'border-l-indigo-500',
};

export function TaskBlock({ entry, isLocked }: TaskBlockProps) {
  return (
    <div
      className={cn(
        'group relative flex items-stretch bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden transition-all',
        'hover:bg-zinc-800/80 hover:border-zinc-700',
        PILLAR_BORDERS[entry.pillar as keyof typeof PILLAR_BORDERS] || 'border-l-zinc-500',
        'border-l-4'
      )}
    >
      {/* Drag Handle */}
      {!isLocked && (
        <div className="flex items-center justify-center px-2 cursor-grab text-zinc-600 hover:text-zinc-300">
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Time Slot */}
      <div className="flex flex-col items-center justify-center px-4 py-3 bg-zinc-950/50 min-w-[80px] border-r border-zinc-800">
        <span className="text-xs font-medium text-zinc-300">{entry.time_start}</span>
        <span className="text-xs text-zinc-600">to</span>
        <span className="text-xs font-medium text-zinc-300">{entry.time_end}</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">{entry.title}</h4>
            <div className="flex items-center gap-3 mt-2">
              <PillarBadge pillar={entry.pillar as any} />
              <span className="text-xs text-zinc-500 capitalize">{entry.type}</span>
              <span className="text-xs text-zinc-500 capitalize">Energy: {entry.energy_cost}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <span
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium capitalize',
                entry.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                entry.status === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                entry.status === 'skipped' ? 'bg-rose-500/10 text-rose-400' :
                'bg-zinc-800 text-zinc-400'
              )}
            >
              {entry.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
