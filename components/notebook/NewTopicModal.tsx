'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { NOTEBOOK_COLORS, type NotebookColorValue } from '@/lib/validators/notebook';

/**
 * NewTopicModal
 *
 * Modal for creating a new notebook topic.
 * Fields: title (text), icon (emoji picker 4×3 grid), color (6 swatches).
 *
 * Posts to POST /api/notebook/topics on submit.
 */

// ── Preset emoji list (12 items, 4×3 grid) ──────────────────────────────────
const EMOJI_PRESETS = ['💡', '📚', '💬', '🔍', '✈️', '🧠', '💪', '🎯', '🌱', '🎵', '📝', '⚡'];

// ── Color swatch config ──────────────────────────────────────────────────────
const COLOR_SWATCHES: { value: NotebookColorValue; bg: string }[] = [
  { value: 'amber',   bg: 'bg-amber-400'   },
  { value: 'blue',    bg: 'bg-blue-400'    },
  { value: 'rose',    bg: 'bg-rose-400'    },
  { value: 'emerald', bg: 'bg-emerald-400' },
  { value: 'indigo',  bg: 'bg-indigo-400'  },
  { value: 'zinc',    bg: 'bg-zinc-400'    },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function NewTopicModal({ isOpen, onClose, onCreated }: NewTopicModalProps) {
  const [title,  setTitle]  = useState('');
  const [icon,   setIcon]   = useState('📝');
  const [color,  setColor]  = useState<NotebookColorValue>('indigo');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function reset() {
    setTitle('');
    setIcon('📝');
    setColor('indigo');
    setPinned(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/notebook/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), icon, color, pinned }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create topic.');
        return;
      }

      reset();
      onCreated();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Topic">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Title ── */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Topic name
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
            placeholder="e.g. Learnings, Ideas, Lines…"
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          />
          <p className="text-xs text-zinc-600 text-right mt-1">{title.length}/60</p>
        </div>

        {/* ── Icon picker ── */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={[
                  'flex items-center justify-center h-10 rounded-xl text-xl transition-all border',
                  icon === emoji
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600',
                ].join(' ')}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* ── Color picker ── */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Color
          </label>
          <div className="flex gap-3">
            {COLOR_SWATCHES.map(({ value, bg }) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                className={[
                  'h-7 w-7 rounded-full transition-all',
                  bg,
                  color === value
                    ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-indigo-500 scale-110'
                    : 'opacity-70 hover:opacity-100',
                ].join(' ')}
                aria-label={value}
              />
            ))}
          </div>
        </div>

        {/* ── Pin toggle ── */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm text-zinc-400">Pin this topic to the top</span>
        </label>

        {/* ── Error ── */}
        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* ── Preview ── */}
        <div className="flex items-center gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-medium text-zinc-200 truncate">
            {title || 'Topic name'}
          </span>
          <span className={`ml-auto h-3 w-3 rounded-full ${COLOR_SWATCHES.find(c => c.value === color)?.bg}`} />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Topic'}
        </button>
      </form>
    </Modal>
  );
}
