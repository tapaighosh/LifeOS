'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * NewEntryDrawer
 *
 * Slide-up drawer for adding a note to a notebook topic.
 * Matches the AddToTodayDrawer shell pattern: fixed overlay + bottom panel.
 *
 * Character counter appears at >= 1800 chars:
 *   amber  1800–1999
 *   rose   2000+
 */

interface NewEntryDrawerProps {
  topicId: string;
  topicName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  prefillSource?: string;
}

function counterColor(len: number): string {
  if (len >= 2000) return 'text-rose-400';
  if (len >= 1800) return 'text-amber-400';
  return 'text-zinc-500';
}

export function NewEntryDrawer({
  topicId,
  topicName,
  isOpen,
  onClose,
  onAdded,
  prefillSource = '',
}: NewEntryDrawerProps) {
  const [body,    setBody]    = useState('');
  const [source,  setSource]  = useState(prefillSource);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setBody('');
      setSource(prefillSource);
      setError(null);
      // Slight delay so the drawer animation completes before focus
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [isOpen, prefillSource]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!body.trim()) {
      setError('Write something first.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/notebook/topics/${topicId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), source: source.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to save entry');
        return;
      }

      setToast('Entry saved ✓');
      setTimeout(() => setToast(null), 2000);
      onAdded();
      onClose();
      setBody('');
      setSource('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[90vh] flex flex-col">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <div>
            <h2 className="font-semibold text-zinc-100 text-sm">New entry</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{topicName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 pb-8 space-y-4">
          {/* Body textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={8}
              placeholder="Write anything…"
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 resize-none leading-relaxed transition-colors"
            />

            {/* Character counter — visible only at >= 1800 */}
            {body.length >= 1800 && (
              <p className={`text-xs text-right mt-1 ${counterColor(body.length)}`}>
                {body.length} / 5000
              </p>
            )}
          </div>

          {/* Source input */}
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            maxLength={100}
            placeholder="Where did this come from? (optional)"
            defaultValue={prefillSource}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}

          {/* Toast */}
          {toast && (
            <p className="text-xs text-emerald-400">{toast}</p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !body.trim()}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>
    </>
  );
}
