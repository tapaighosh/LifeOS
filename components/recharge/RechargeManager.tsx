'use client';

import { useState } from 'react';
import { Star, Clock, Trash2, Plus, Loader2 } from 'lucide-react';
import { useRecharge } from '@/hooks/useRecharge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { RechargeItem } from '@/hooks/useRecharge';

function RechargeCard({
  item,
  onToggleFavourite,
  onDelete,
}: {
  item: RechargeItem;
  onToggleFavourite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(item._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-emerald-500/40 transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggleFavourite(item._id, item.favourite)}
          className="text-zinc-500 hover:text-amber-400 transition-colors p-1"
          title={item.favourite ? "Remove from favourites" : "Add to favourites"}
        >
          <Star className={cn("h-5 w-5", item.favourite && "fill-amber-400 text-amber-400")} />
        </button>
        <div>
          <h4 className="font-medium text-emerald-50">{item.title}</h4>
          <p className="text-xs text-emerald-400/70 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {item.duration} min
          </p>
        </div>
      </div>
      
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-zinc-600 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete item"
      >
        {deleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function RechargeManager() {
  const { items, isLoading, error, createItem, deleteItem, toggleFavourite } = useRecharge();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (duration < 5 || duration > 15) {
      setFormError('Duration must be between 5 and 15 minutes');
      return;
    }

    setSubmitting(true);
    try {
      await createItem({ title, duration, favourite: false, active: true });
      setTitle('');
      setDuration(15);
      setIsAdding(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        Failed to load recharge items.
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <span>⚡</span> Recharge Library
          </h2>
          <p className="text-sm text-emerald-400/60 mt-1">
            Micro-breaks to restore energy between tasks.
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            variant="recharge"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="e.g. Quick walk"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="w-full sm:w-32">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="recharge" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
          {formError && <p className="text-rose-400 text-xs mt-2">{formError}</p>}
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-emerald-400/50">
          No recharge items found. Add one to start.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <RechargeCard
              key={item._id}
              item={item}
              onToggleFavourite={toggleFavourite}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
