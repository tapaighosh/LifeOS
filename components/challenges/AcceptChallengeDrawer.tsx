'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { LibraryChallenge } from '@/lib/challenges/library';

const PILLAR_OPTIONS = [
  { value: 'money',     label: '💰 Money',     color: 'border-amber-500/50  bg-amber-500/10  text-amber-400' },
  { value: 'soul',      label: '🔥 Soul',      color: 'border-rose-500/50   bg-rose-500/10   text-rose-400' },
  { value: 'curiosity', label: '🧠 Curiosity', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'daily',     label: 'Daily' },
  { value: 'alternate', label: 'Alternate days' },
  { value: '3x_week',   label: '3× per week' },
  { value: 'weekly',    label: 'Weekly' },
] as const;

interface Props {
  item: LibraryChallenge;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AcceptChallengeDrawer({ item, onClose, onSuccess }: Props) {
  const [pillar, setPillar] = useState<'money' | 'soul' | 'curiosity'>(item.suggested_pillar);
  const [frequency, setFrequency] = useState<string>(item.suggested_frequency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/challenges/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ library_id: item.id, pillar, frequency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 pb-safe animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-zinc-100 mb-1">{item.title}</h2>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{item.description}</p>

        {/* Pillar selector */}
        <div className="mb-5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">
            Which pillar does this belong to?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PILLAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPillar(opt.value)}
                className={`
                  py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200
                  ${pillar === opt.value ? opt.color : 'border-zinc-800 bg-zinc-900 text-zinc-500'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency override */}
        <div className="mb-7">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">
            Frequency{' '}
            <span className="normal-case text-zinc-600">(suggested: {item.suggested_frequency})</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFrequency(opt.value)}
                className={`
                  py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200
                  ${frequency === opt.value
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-500'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
        )}

        {/* Confirm */}
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {loading ? 'Accepting...' : 'Accept Challenge'}
        </button>
      </div>
    </>
  );
}
