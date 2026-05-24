'use client';

import { useState, useEffect } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle2, Circle, AlertCircle, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayLogCheckinPayload } from '@/lib/validators/dayLog';

const EMOJIS = ['😫', '🥱', '😐', '🙂', '🤩'];
const SKIP_REASONS = ['tired', 'no time', 'forgot', 'spontaneous'];

export function CheckInForm() {
  const { plan, isLoading } = usePlan();
  
  const [entries, setEntries] = useState<Record<string, { status: string; completion_pct?: number; skip_reason?: string; entry_type?: string }>>({});
  const [energyRating, setEnergyRating] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      const initialEntries: Record<string, any> = {};
      plan.plan.forEach(p => {
        if (p.type === 'recharge') return;
        const key = p.entry_type === 'queue_topic' ? p.topic_item_id?.toString() : p.task_id?.toString();
        if (!key) return;
        initialEntries[key] = { 
          status: p.status === 'pending' ? 'done' : p.status,
          entry_type: p.entry_type || 'task'
        };
      });
      setEntries(initialEntries);
    }
  }, [plan]);

  const updateEntry = (taskId: string, data: any) => {
    setEntries(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...data }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!energyRating) {
      setError('Please select an energy rating for today.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const payload: DayLogCheckinPayload = {
        date: plan!.date,
        entries: Object.entries(entries).map(([id, data]) => ({
          task_id: data.entry_type === 'task' ? id : undefined,
          topic_item_id: data.entry_type === 'queue_topic' ? id : undefined,
          entry_type: (data.entry_type || 'task') as 'task' | 'queue_topic',
          status: data.status as 'done' | 'partial' | 'skipped',
          completion_pct: data.status === 'partial' ? (data.completion_pct || 50) : undefined,
          skip_reason: data.status === 'skipped' ? data.skip_reason : undefined,
        })),
        energy_rating: energyRating,
        reflection: reflection.trim() ? reflection.trim() : undefined,
      };

      const res = await fetch('/api/log/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit check-in');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-zinc-500" /></div>;
  if (!plan) return <div className="text-center p-10 text-zinc-400">No plan available for today to check in.</div>;

  if (result) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Moon className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">Check-in Complete!</h2>
        <p className="text-zinc-400 max-w-sm mx-auto">Great job wrapping up the day. The system has updated your revision cycles and balances.</p>
        
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-left max-w-md mx-auto space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-300">AI Insight</h4>
            <p className="text-xs text-indigo-400 bg-indigo-500/10 p-2 rounded">{result.aiPlaceholder}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-zinc-300">Neglected Pillars</h4>
            {result.neglectedPillars.length > 0 ? (
              <div className="flex gap-2">
                {result.neglectedPillars.map((p: string) => (
                  <span key={p} className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-xs capitalize">{p}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400">Great balance this week!</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-zinc-300">Tomorrow's Focus</h4>
            <ul className="text-xs text-zinc-400 space-y-1">
              {result.tomorrowPreview.map((t: any) => (
                <li key={t._id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /> {t.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center justify-center gap-2">
          <Moon className="h-6 w-6 text-indigo-400" />
          Night Check-In
        </h2>
        <p className="text-zinc-400 text-sm">Review your day, lock in your progress, and prepare for tomorrow.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">Today's Tasks</h3>
        {plan.plan.map((entry) => {
          if (entry.type === 'recharge') return null;
          const entryKey = entry.entry_type === 'queue_topic' ? entry.topic_item_id?.toString() : entry.task_id?.toString();
          if (!entryKey) return null;
          const st = entries[entryKey]?.status || 'done';
          return (
            <div key={entryKey} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">{entry.title}</span>
                <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button type="button" onClick={() => updateEntry(entryKey, { status: 'done' })} className={cn("px-3 py-1 text-xs rounded-md transition-colors", st === 'done' ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}>Done</button>
                  <button type="button" onClick={() => updateEntry(entryKey, { status: 'partial' })} className={cn("px-3 py-1 text-xs rounded-md transition-colors", st === 'partial' ? "bg-amber-500/20 text-amber-400" : "text-zinc-500 hover:text-zinc-300")}>Partial</button>
                  <button type="button" onClick={() => updateEntry(entryKey, { status: 'skipped' })} className={cn("px-3 py-1 text-xs rounded-md transition-colors", st === 'skipped' ? "bg-rose-500/20 text-rose-400" : "text-zinc-500 hover:text-zinc-300")}>Skip</button>
                </div>
              </div>

              {st === 'partial' && (
                <div className="pt-2 border-t border-zinc-800/50">
                  <label className="text-xs text-zinc-500 mb-2 block">Completion Percentage</label>
                  <div className="flex gap-2">
                    {[25, 50, 75].map(pct => (
                      <button key={pct} type="button" onClick={() => updateEntry(entryKey, { completion_pct: pct })} className={cn("flex-1 py-1 border rounded text-xs", entries[entryKey]?.completion_pct === pct ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-zinc-800 text-zinc-500 hover:bg-zinc-800")}>{pct}%</button>
                    ))}
                  </div>
                </div>
              )}

              {st === 'skipped' && (
                <div className="pt-2 border-t border-zinc-800/50">
                  <label className="text-xs text-zinc-500 mb-2 block">Reason</label>
                  <select 
                    value={entries[entryKey]?.skip_reason || ''} 
                    onChange={(e) => updateEntry(entryKey, { skip_reason: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300"
                  >
                    <option value="" disabled>Select reason...</option>
                    {SKIP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-4">Energy Rating (1-5)<span className="text-rose-500">*</span></label>
          <div className="flex justify-between items-center gap-2">
            {EMOJIS.map((emoji, idx) => {
              const rating = idx + 1;
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => { setEnergyRating(rating); setError(null); }}
                  className={cn("h-12 w-12 text-2xl rounded-full flex items-center justify-center transition-all", energyRating === rating ? "bg-indigo-500/20 border-2 border-indigo-500 scale-110" : "bg-zinc-800/50 border-2 border-transparent grayscale hover:grayscale-0")}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-semibold text-zinc-300 mb-2">
            Daily Reflection
            <span className={cn("text-xs font-normal", reflection.length > 200 ? "text-rose-400" : "text-zinc-500")}>{reflection.length}/200</span>
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 min-h-[100px] resize-none focus:outline-none focus:border-indigo-500"
            placeholder="How did today go?"
          />
        </div>
      </div>

      {error && <p className="text-rose-400 text-sm flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {error}</p>}

      <Button type="submit" disabled={submitting || reflection.length > 200} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500">
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Check-In'}
      </Button>
    </form>
  );
}
