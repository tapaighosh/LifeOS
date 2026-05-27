'use client';

import { useState } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { DayPlan } from '@/components/plan/DayPlan';
import { NowPlaying } from '@/components/plan/NowPlaying';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Lock, Unlock, PauseCircle } from 'lucide-react';

export function DashboardClient() {
  const { plan: planData, isLoading, generatePlan, reorderPlan, lockPlan } = usePlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await generatePlan(new Date().toLocaleDateString('en-CA'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReorder = async (newPlanList: Parameters<typeof reorderPlan>[1]) => {
    try {
      await reorderPlan(planData!.date, newPlanList);
    } catch (err) {
      console.error('Failed to save order', err);
    }
  };

  const toggleLock = async () => {
    if (!planData) return;
    try {
      setIsUpdating(true);
      await lockPlan(planData!.date, !planData.locked);
    } catch (err) {
      console.error('Failed to toggle lock');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTour = async () => {
    if (!planData) return;
    try {
      setIsUpdating(true);
      await lockPlan(planData!.date, true);
    } catch (err) {
      console.error('Failed to pause plan');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Good Morning</h1>
          <p className="text-zinc-400 mt-1">Ready to tackle the day?</p>
        </div>
        
        {planData && !planData.paused && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                setIsUpdating(true);
                try { await lockPlan(today, true); } finally { setIsUpdating(false); }
              }}
              disabled={isUpdating}
              className="text-zinc-400 hover:text-rose-400"
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              On a Tour?
            </Button>
            <Button 
              variant={planData.locked ? 'outline' : 'default'}
              size="sm" 
              onClick={toggleLock}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> :
               planData.locked ? <><Unlock className="h-4 w-4 mr-2" /> Unlock Plan</> : <><Lock className="h-4 w-4 mr-2" /> Lock Plan</>}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {error}
        </div>
      )}

      {/* State: No Plan */}
      {!planData && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <div className="h-16 w-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-200 mb-2">No Plan for Today</h2>
          <p className="text-zinc-400 max-w-sm mb-8">
            Generate an AI-optimized schedule based on your available tasks and energy patterns.
          </p>
          <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full sm:w-auto px-8">
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
            {isGenerating ? 'Generating...' : 'Generate My Day'}
          </Button>
        </div>
      )}

      {/* State: Plan Paused */}
      {planData && planData.paused && (
        <div className="p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
          <PauseCircle className="h-12 w-12 text-rose-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-rose-300 mb-2">Plan Paused</h3>
          <p className="text-rose-400/80 max-w-md mx-auto mb-6">
            You marked today as a day off or tour. Have a great time!
          </p>
          <Button variant="outline" onClick={() => lockPlan(planData!.date, false)}>
            Resume Plan
          </Button>
        </div>
      )}

      {/* State: Plan Active */}
      {planData && !planData.paused && (
        <>
          <NowPlaying plan={planData.plan} />

          <div className={cn(
            "rounded-2xl border bg-zinc-900/50 p-6 transition-all",
            planData.locked ? "border-zinc-800" : "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          )}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Today's Schedule
                {planData.locked && <Lock className="h-4 w-4 text-zinc-500" />}
              </h3>
              <div className="text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                {planData.source === 'ai' ? '✨ AI Generated' : '⚙️ Rule-Based'}
              </div>
            </div>

            {planData.ai_note && (
              <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300/90 leading-relaxed">
                <span className="font-bold text-indigo-400 mr-2">Insight:</span>
                {planData.ai_note}
              </div>
            )}

            <DayPlan />
          </div>
        </>
      )}
    </div>
  );
}
