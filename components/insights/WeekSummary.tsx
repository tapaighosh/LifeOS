import { CheckCircle2, BatteryCharging } from 'lucide-react';

interface WeekSummaryProps {
  completionRate: number;
  rechargeCompliance: number;
  totalTasksDone: number;
  totalTasksScheduled: number;
}

export function WeekSummary({ completionRate, rechargeCompliance, totalTasksDone, totalTasksScheduled }: WeekSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
        <div className="text-emerald-400 mb-2">
          <CheckCircle2 className="w-8 h-8 mx-auto" />
        </div>
        <div className="text-3xl font-bold text-zinc-100 mb-1">{completionRate}%</div>
        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Task Completion</div>
        <div className="text-xs text-zinc-500 mt-1">{totalTasksDone} / {totalTasksScheduled} done</div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
        <div className="text-amber-400 mb-2">
          <BatteryCharging className="w-8 h-8 mx-auto" />
        </div>
        <div className="text-3xl font-bold text-zinc-100 mb-1">{rechargeCompliance}%</div>
        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Recharge Compliance</div>
      </div>
    </div>
  );
}
