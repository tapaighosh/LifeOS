'use client';

/**
 * AddToTodayDrawer — "Free time? Pick something meaningful."
 *
 * Three tabs with distinct data sources:
 *
 *   Tab 1 "From Tasks":
 *     Fetches GET /api/tasks (all active tasks), filters out those already in today's plan.
 *     Source: master task list. The plan ID list is passed down as a prop.
 *     Use case: user wants to add a pre-existing task they forgot about.
 *
 *   Tab 2 "From Challenges":
 *     Fetches GET /api/challenges (active challenges with linked_task_id).
 *     Source: challenge collection. Links back to the Task that was auto-created.
 *     Use case: user has free time and wants to work on a challenge commitment.
 *
 *   Tab 3 "Quick Add":
 *     No pre-fetch — entirely local form state.
 *     Source: user input only. Creates a one-time task on the fly.
 *     If "save to library" is unchecked: creates task + adds to plan without master list persistence.
 *     If checked: POST /api/tasks first, then add to plan. Task lives in master list for future plans.
 *     Use case: spontaneous task that doesn't need to be recurring.
 */

import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import { X, CheckSquare, Trophy, Zap } from 'lucide-react';

const PILLAR_OPTIONS = [
  { value: 'money',     label: '💰 Money' },
  { value: 'soul',      label: '🔥 Soul' },
  { value: 'curiosity', label: '🧠 Curiosity' },
] as const;

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

const PILLAR_BADGE: Record<string, string> = {
  money:     'bg-amber-500/15 text-amber-400',
  soul:      'bg-rose-500/15 text-rose-400',
  curiosity: 'bg-blue-500/15 text-blue-400',
};

type Tab = 'tasks' | 'challenges' | 'quick';

interface Props {
  planTaskIds: string[]; // task_ids already in today's plan
  onClose: () => void;
  onAdded: () => void;  // triggers SWR revalidation in parent
}

// ── Shared time-slot picker ───────────────────────────────────────────────────

function TimeSlotPicker({
  onConfirm,
  loading,
}: {
  onConfirm: (start: string, end: string) => void;
  loading: boolean;
}) {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('09:30');
  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5"
      />
      <span className="text-zinc-600 text-xs">to</span>
      <input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5"
      />
      <button
        onClick={() => onConfirm(start, end)}
        disabled={loading}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all"
      >
        {loading ? '...' : 'Add'}
      </button>
    </div>
  );
}

// ── Add to plan helper ────────────────────────────────────────────────────────

async function addToPlan(task_id: string, start: string, end: string): Promise<boolean> {
  const res = await fetch('/api/plan/add-task', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id, time_start: start, time_end: end }),
  });
  return res.ok;
}

// ── Tab 1: From Tasks ─────────────────────────────────────────────────────────

function TasksTab({ planTaskIds, onAdded }: { planTaskIds: string[]; onAdded: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data || []).filter(
          (t: any) => t.active && t.type !== 'recharge' && !planTaskIds.includes(t._id)
        );
        setTasks(filtered);
      })
      .finally(() => setLoading(false));
  }, [planTaskIds]);

  if (loading) return <div className="py-8 text-center text-zinc-500 text-sm animate-pulse">Loading tasks…</div>;
  if (tasks.length === 0) return <div className="py-8 text-center text-zinc-500 text-sm">All your tasks are already in today's plan.</div>;

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {tasks.map((t) => (
        <div key={t._id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${PILLAR_BADGE[t.pillar]}`}>
              {t.pillar}
            </span>
            <span className="flex-1 text-sm text-zinc-200 truncate">{t.title}</span>
            <span className="text-xs text-zinc-500">{t.duration}m</span>
            <button
              onClick={() => setSelected(selected === t._id ? null : t._id)}
              className="text-xs text-indigo-400 hover:underline"
            >
              {selected === t._id ? 'Cancel' : 'Select'}
            </button>
          </div>
          {selected === t._id && (
            <TimeSlotPicker
              loading={adding === t._id}
              onConfirm={async (start, end) => {
                setAdding(t._id);
                const ok = await addToPlan(t._id, start, end);
                if (ok) { mutate('/api/plan/today'); onAdded(); }
                setAdding(null);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab 2: From Challenges ────────────────────────────────────────────────────

function ChallengesTab({ planTaskIds, onAdded }: { planTaskIds: string[]; onAdded: () => void }) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/challenges')
      .then((r) => r.json())
      .then((data) => setChallenges((data || []).filter((c: any) => c.status === 'active')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-zinc-500 text-sm animate-pulse">Loading challenges…</div>;
  if (challenges.length === 0) return (
    <div className="py-8 text-center text-zinc-500 text-sm">
      No active challenges.{' '}
      <a href="/challenges" className="text-indigo-400 hover:underline">Browse the library →</a>
    </div>
  );

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {challenges.map((ch) => {
        const taskId = ch.linked_task_id?._id ?? ch.linked_task_id;
        const alreadyIn = planTaskIds.includes(taskId?.toString());
        return (
          <div key={ch._id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 capitalize">{ch.category}</span>
              <span className="flex-1 text-sm text-zinc-200 truncate">{ch.title}</span>
              {alreadyIn ? (
                <span className="text-xs text-emerald-400">In plan ✓</span>
              ) : (
                <button
                  onClick={() => setSelected(selected === ch._id ? null : ch._id)}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {selected === ch._id ? 'Cancel' : 'Add'}
                </button>
              )}
            </div>
            {selected === ch._id && !alreadyIn && taskId && (
              <TimeSlotPicker
                loading={adding === ch._id}
                onConfirm={async (start, end) => {
                  setAdding(ch._id);
                  const ok = await addToPlan(taskId.toString(), start, end);
                  if (ok) { mutate('/api/plan/today'); onAdded(); }
                  setAdding(null);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: Quick Add ──────────────────────────────────────────────────────────

function QuickAddTab({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [pillar, setPillar] = useState<'money' | 'soul' | 'curiosity'>('soul');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('09:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError(null);

    try {
      // Create a one-time task
      const taskRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          pillar,
          type: 'one-time',
          duration,
          energy_cost: 'medium',
          slot_preference: 'any',
          active: true,
        }),
      });

      if (!taskRes.ok) {
        const d = await taskRes.json();
        setError(d.error || 'Failed to create task');
        return;
      }

      const newTask = await taskRes.json();
      const ok = await addToPlan(newTask._id, timeStart, timeEnd);

      if (!ok) { setError('Task created but could not add to plan'); return; }

      // If user chose NOT to save to library, deactivate the task after adding
      if (!saveToLibrary) {
        await fetch(`/api/tasks/${newTask._id}`, { method: 'DELETE' });
      }

      mutate('/api/plan/today');
      onAdded();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Task title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Call the vet"
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Pillar</label>
        <div className="grid grid-cols-3 gap-2">
          {PILLAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPillar(opt.value)}
              className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                pillar === opt.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Duration</label>
        <div className="grid grid-cols-3 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                duration === d
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-500'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Start</label>
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">End</label>
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={saveToLibrary}
          onChange={(e) => setSaveToLibrary(e.target.checked)}
          className="rounded border-zinc-700 bg-zinc-800 text-indigo-500"
        />
        <span className="text-xs text-zinc-400">Save to task library (add to master list)</span>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add to Today'}
      </button>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks',      label: 'From Tasks',      icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: 'challenges', label: 'From Challenges', icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: 'quick',      label: 'Quick Add',       icon: <Zap className="h-3.5 w-3.5" /> },
];

export default function AddToTodayDrawer({ planTaskIds, onClose, onAdded }: Props) {
  const [tab, setTab] = useState<Tab>('tasks');

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <h2 className="font-semibold text-zinc-100">+ Add to Today</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 bg-zinc-900/60 rounded-xl p-1 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === 'tasks'      && <TasksTab      planTaskIds={planTaskIds} onAdded={onAdded} />}
          {tab === 'challenges' && <ChallengesTab planTaskIds={planTaskIds} onAdded={onAdded} />}
          {tab === 'quick'      && <QuickAddTab   onAdded={onAdded} />}
        </div>
      </div>
    </>
  );
}
