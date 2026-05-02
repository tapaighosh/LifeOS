'use client';

import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NowPlaying({ plan }: { plan: any[] }) {
  const [currentTask, setCurrentTask] = useState<any | null>(null);
  
  useEffect(() => {
    // Check every minute
    const updateCurrent = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hours}:${mins}`;

      const active = plan.find(t => t.time_start <= currentTimeStr && t.time_end >= currentTimeStr);
      setCurrentTask(active || null);
    };

    updateCurrent();
    const interval = setInterval(updateCurrent, 60000);
    return () => clearInterval(interval);
  }, [plan]);

  if (!currentTask) {
    return null;
  }

  const isRecharge = currentTask.type === 'recharge';
  const colorClass = isRecharge 
    ? 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/40 text-emerald-100'
    : 'from-blue-500/20 to-blue-900/10 border-blue-500/40 text-blue-100';

  return (
    <div className={cn(
      "w-full rounded-2xl border p-4 mb-8 flex items-center gap-4 bg-gradient-to-r shadow-lg relative overflow-hidden",
      colorClass
    )}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      
      <div className="relative z-10 flex-shrink-0">
        <PlayCircle className={cn("h-8 w-8 animate-pulse", isRecharge ? "text-emerald-400" : "text-blue-400")} />
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">Now Active</p>
        <h3 className="font-bold text-lg truncate">{currentTask.title}</h3>
      </div>
      <div className="relative z-10 text-right">
        <p className="text-sm font-semibold">{currentTask.time_start} - {currentTask.time_end}</p>
        <p className="text-[10px] opacity-70 uppercase font-bold">{currentTask.pillar}</p>
      </div>
    </div>
  );
}
