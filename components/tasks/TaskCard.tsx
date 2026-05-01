'use client';

/**
 * TaskCard — displays a single task with pillar-colored accent,
 * energy indicator, duration chip, and edit/delete actions.
 *
 * Design: glassmorphism card with pillar-colored left border,
 * hover lift animation, and subtle gradient overlay.
 */

import { useState } from 'react';
import { Clock, Zap, Pencil, Trash2, RotateCcw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Task } from '@/hooks/useTasks';

// ─── Pillar Config ────────────────────────────────────────────────────────────

const PILLAR_CONFIG = {
  money: {
    label: '💰 Money',
    badgeVariant: 'money' as const,
    border: 'border-l-amber-500',
    glow: 'hover:shadow-amber-500/10',
    bg: 'from-amber-500/5 to-transparent',
  },
  soul: {
    label: '🔥 Soul',
    badgeVariant: 'soul' as const,
    border: 'border-l-rose-500',
    glow: 'hover:shadow-rose-500/10',
    bg: 'from-rose-500/5 to-transparent',
  },
  curiosity: {
    label: '🧠 Curiosity',
    badgeVariant: 'curiosity' as const,
    border: 'border-l-indigo-500',
    glow: 'hover:shadow-indigo-500/10',
    bg: 'from-indigo-500/5 to-transparent',
  },
} as const;

const ENERGY_CONFIG = {
  high: { label: 'High', color: 'text-rose-400', dots: 3 },
  medium: { label: 'Medium', color: 'text-amber-400', dots: 2 },
  low: { label: 'Low', color: 'text-emerald-400', dots: 1 },
} as const;

const TYPE_LABELS: Record<Task['type'], string> = {
  recurring: 'Recurring',
  'one-time': 'One-time',
  project: 'Project',
  recharge: '⚡ Recharge',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [deleting, setDeleting] = useState(false);
  const pillar = PILLAR_CONFIG[task.pillar];
  const energy = ENERGY_CONFIG[task.energy_cost];

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"? This action can't be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(task._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className={cn(
        // Base glass card
        'group relative rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm',
        'border-l-4 overflow-hidden',
        // Pillar-specific left border
        pillar.border,
        // Hover effects
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        pillar.glow
      )}
    >
      {/* Pillar gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          pillar.bg
        )}
      />

      <div className="relative p-4">
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 text-sm leading-snug truncate pr-2">
              {task.title}
            </h3>
            {task.category && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{task.category}</p>
            )}
          </div>

          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              id={`edit-task-${task._id}`}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              id={`delete-task-${task._id}`}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-rose-400"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={`Delete ${task.title}`}
            >
              {deleting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-600 border-t-zinc-300" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant={pillar.badgeVariant}>{pillar.label}</Badge>
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[task.type]}
          </Badge>
          {task.revision && (
            <Badge variant="outline" className="gap-1 text-xs">
              <RotateCcw className="h-2.5 w-2.5" />
              Revision
            </Badge>
          )}
        </div>

        {/* Bottom row: duration, energy, priority */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {/* Duration */}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.duration}m
          </span>

          {/* Energy indicator — dots */}
          <span className={cn('flex items-center gap-1', energy.color)}>
            <Zap className="h-3 w-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full',
                  i < energy.dots ? 'bg-current' : 'bg-zinc-700'
                )}
              />
            ))}
          </span>

          {/* Priority stars */}
          <span className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: task.priority }).map((_, i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-current" />
            ))}
          </span>

          {/* Slot preference */}
          {task.slot_preference !== 'any' && (
            <span className="ml-auto capitalize text-zinc-600">{task.slot_preference}</span>
          )}
        </div>

        {/* Notes */}
        {task.notes && (
          <p className="mt-2 text-xs text-zinc-600 line-clamp-2 leading-relaxed border-t border-zinc-800 pt-2">
            {task.notes}
          </p>
        )}
      </div>
    </article>
  );
}
