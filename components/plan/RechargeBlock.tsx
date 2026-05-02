import { IPlanEntry } from '@/models/DailyPlan';
import { cn } from '@/lib/utils';
import { BatteryCharging, GripVertical } from 'lucide-react';

interface RechargeBlockProps {
  entry: IPlanEntry;
  isLocked: boolean;
}

export function RechargeBlock({ entry, isLocked }: RechargeBlockProps) {
  return (
    <div
      className={cn(
        'group relative flex items-stretch bg-emerald-950/20 border border-emerald-900/50 rounded-xl overflow-hidden transition-all',
        'hover:bg-emerald-900/30 hover:border-emerald-800/50',
        'border-l-emerald-500 border-l-4'
      )}
    >
      {/* Drag Handle */}
      {!isLocked && (
        <div className="flex items-center justify-center px-2 cursor-grab text-emerald-600/50 hover:text-emerald-400">
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Time Slot */}
      <div className="flex flex-col items-center justify-center px-4 py-3 bg-emerald-950/40 min-w-[80px] border-r border-emerald-900/50">
        <span className="text-xs font-medium text-emerald-300">{entry.time_start}</span>
        <span className="text-xs text-emerald-600">to</span>
        <span className="text-xs font-medium text-emerald-300">{entry.time_end}</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BatteryCharging className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-medium text-emerald-100">{entry.title}</h4>
        </div>
        
        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
          Micro-break
        </span>
      </div>
    </div>
  );
}
