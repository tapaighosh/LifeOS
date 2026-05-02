'use client';

import { useState } from 'react';
import { IPlanEntry } from '@/models/DailyPlan';
import { TaskBlock } from './TaskBlock';
import { RechargeBlock } from './RechargeBlock';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/Button';
import { Sparkles, Lock, Unlock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DayPlan() {
  const { plan, isLoading, error, generatePlan, lockPlan, reorderPlan } = usePlan();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
      await generatePlan(today);
    } catch (err) {
      console.error(err);
      alert('Failed to generate plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLockToggle = async () => {
    if (!plan) return;
    try {
      await lockPlan(plan.date, !plan.locked);
    } catch (err) {
      console.error(err);
      alert('Failed to update lock status.');
    }
  };

  // Drag and Drop (Simplified manual swap for now without a complex dnd library to keep dependencies low)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const onDragStart = (idx: number) => {
    if (plan?.locked) return;
    setDraggedIdx(idx);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = async (idx: number) => {
    if (plan?.locked || draggedIdx === null || draggedIdx === idx) return;

    const newPlan = [...plan.plan];
    const [draggedItem] = newPlan.splice(draggedIdx, 1);
    newPlan.splice(idx, 0, draggedItem);

    setDraggedIdx(null);
    try {
      await reorderPlan(plan.date, newPlan);
    } catch (err) {
      console.error(err);
      alert('Failed to reorder plan.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
        <p className="text-zinc-500 text-sm">Loading your day...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Failed to load the daily plan.
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
          <Sparkles className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-zinc-100 mb-2">Ready to conquer the day?</h3>
        <p className="text-zinc-500 text-sm max-w-sm mb-8">
          Let the scheduling engine optimize your tasks, respect your energy levels, and balance your life pillars.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-48 h-12 text-base font-medium"
        >
          {generating ? 'Generating Plan...' : 'Generate My Day'}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-zinc-100">Today's Plan</h3>
            {plan.locked && (
              <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                Locked
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            {plan.ai_note || 'Generated rule-based plan'}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLockToggle}
          className={cn(
            "gap-2 transition-colors",
            plan.locked ? "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {plan.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          {plan.locked ? 'Unlock Plan' : 'Lock Plan'}
        </Button>
      </div>

      {/* Plan List */}
      <div className="space-y-3">
        {plan.plan.map((entry, idx) => (
          <div
            key={`${entry.task_id}-${idx}`}
            draggable={!plan.locked}
            onDragStart={() => onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(idx)}
            className={cn(
              "transition-all duration-200",
              !plan.locked && "cursor-grab active:cursor-grabbing",
              draggedIdx === idx && "opacity-50 scale-95"
            )}
          >
            {entry.type === 'recharge' ? (
              <RechargeBlock entry={entry} isLocked={plan.locked} />
            ) : (
              <TaskBlock entry={entry} isLocked={plan.locked} />
            )}
          </div>
        ))}

        {plan.plan.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
            No tasks scheduled for today. Take a break!
          </div>
        )}
      </div>

      {/* Skipped Tasks Notice */}
      {plan.skipped_tasks?.length > 0 && (
        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Overflow Tasks
          </h4>
          <p className="text-xs text-amber-400/70">
            {plan.skipped_tasks.length} task(s) could not fit into today's available time windows. They will remain pending for tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}
