'use client';

/**
 * AddTopicDrawer — Slide-up drawer for adding a new topic to a queue
 *
 * Uses CSS translate transition for smooth slide-up animation.
 * Autofocuses the title input when opened.
 */

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface AddTopicDrawerProps {
  queueId: string;
  queueType: 'concept' | 'dsa';
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyColors: Record<Difficulty, string> = {
  easy: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300',
  medium: 'border-amber-500/60 bg-amber-500/15 text-amber-300',
  hard: 'border-rose-500/60 bg-rose-500/15 text-rose-300',
};

const difficultyDefault: Record<Difficulty, string> = {
  easy: 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
  medium: 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
  hard: 'border-zinc-700 text-zinc-500 hover:border-zinc-500',
};

export function AddTopicDrawer({
  queueId,
  queueType,
  isOpen,
  onClose,
  onAdded,
}: AddTopicDrawerProps) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 150);
    } else {
      setTitle('');
      setDifficulty('medium');
      setError('');
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/queues/${queueId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), difficulty }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to add topic');
        return;
      }

      onAdded();
      onClose();
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-6 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-100">
            + Add {queueType === 'dsa' ? 'Problem' : 'Topic'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              {queueType === 'dsa' ? 'Problem name' : 'Topic title'} *
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={queueType === 'dsa' ? 'e.g. Longest Increasing Subsequence' : 'e.g. Basal Metabolic Rate'}
              maxLength={200}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Difficulty selector */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    difficulty === d ? difficultyColors[d] : difficultyDefault[d]
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
