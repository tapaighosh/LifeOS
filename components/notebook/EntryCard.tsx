'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { INotebookEntry } from '@/models/NotebookEntry';

/**
 * EntryCard
 *
 * Three-state card: collapsed → expanded → editing.
 *
 * Collapsed:  date + first 80 chars preview
 * Expanded:   full body, source attribution, Edit / Delete actions
 * Editing:    textarea with char counter, source input, Save / Cancel
 */

interface EntryCardProps {
  entry: INotebookEntry;
  onUpdated: () => void;
  onDeleted: () => void;
}

// ── Date helper ──────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d     = new Date(date);
  const today = new Date();
  const yest  = new Date(Date.now() - 86_400_000);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yest))  return 'Yesterday';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Character counter colour ─────────────────────────────────────────────────

function counterColor(len: number): string {
  if (len >= 2000) return 'text-rose-400';
  if (len >= 1800) return 'text-amber-400';
  return 'text-zinc-500';
}

// ── Component ────────────────────────────────────────────────────────────────

export function EntryCard({ entry, onUpdated, onDeleted }: EntryCardProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // Edit form state — initialised from entry on each edit open
  const [draftBody,   setDraftBody]   = useState(entry.body);
  const [draftSource, setDraftSource] = useState(entry.source ?? '');

  const bodyPreview = entry.body.length > 80
    ? entry.body.slice(0, 80) + '…'
    : entry.body;

  // ── Open edit ──────────────────────────────────────────────────────────────
  function openEdit() {
    setDraftBody(entry.body);
    setDraftSource(entry.source ?? '');
    setEditing(true);
    setExpanded(true);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!draftBody.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notebook/entries/${entry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draftBody.trim(), source: draftSource.trim() }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/notebook/entries/${entry._id}`, {
        method: 'DELETE',
      });
      if (res.ok) onDeleted();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 transition-all">

      {/* ── Date label ── */}
      <p className="text-xs text-zinc-500 mb-2">
        {formatDate(entry.created_at)}
      </p>

      {/* ── Collapsed view ── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-left text-sm text-zinc-300 leading-relaxed"
        >
          {bodyPreview}
        </button>
      )}

      {/* ── Expanded / editing view ── */}
      {expanded && (
        <div className="space-y-3">

          {editing ? (
            /* ── Edit mode ── */
            <>
              <textarea
                autoFocus
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Write anything…"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />

              {/* Character counter — only visible at >= 1800 */}
              {draftBody.length >= 1800 && (
                <p className={`text-xs text-right ${counterColor(draftBody.length)}`}>
                  {draftBody.length} / 5000
                </p>
              )}

              <input
                type="text"
                value={draftSource}
                onChange={(e) => setDraftSource(e.target.value)}
                maxLength={100}
                placeholder="Where did this come from? (optional)"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
              />

              {/* Save / Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !draftBody.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setExpanded(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-medium hover:text-zinc-200 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* ── Read mode (expanded) ── */
            <>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {entry.body}
              </p>

              {entry.source && (
                <p className="text-xs text-zinc-500 italic">— {entry.source}</p>
              )}

              {/* Action row */}
              <div className="flex items-center gap-3 pt-1">
                {/* Collapse */}
                <button
                  onClick={() => setExpanded(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Collapse
                </button>

                <span className="text-zinc-700">·</span>

                {/* Edit */}
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>

                <span className="text-zinc-700">·</span>

                {/* Delete / confirm */}
                {confirmDelete ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Delete?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-rose-400 hover:text-rose-300 font-medium disabled:opacity-50"
                    >
                      {deleting ? '…' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
