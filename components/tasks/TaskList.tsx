'use client';

/**
 * TaskList — renders tasks either grouped by pillar or as a flat list.
 *
 * Grouped mode: 3 sections (Money | Soul | Curiosity) with pillar headers,
 * task counts, and colored section dividers.
 *
 * Flat mode: all tasks sorted by priority DESC, then createdAt DESC.
 *
 * Handles loading (skeleton grid), empty state (contextual message),
 * and error state (error card).
 */

import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/hooks/useTasks';

// ─── Pillar Section Config ────────────────────────────────────────────────────

const PILLAR_SECTIONS = [
  {
    pillar: 'money' as const,
    label: '💰 Money Making',
    color: 'text-amber-400',
    divider: 'from-amber-500/50 to-transparent',
    countClass: 'bg-amber-500/10 text-amber-400',
  },
  {
    pillar: 'soul' as const,
    label: '🔥 For My Soul',
    color: 'text-rose-400',
    divider: 'from-rose-500/50 to-transparent',
    countClass: 'bg-rose-500/10 text-rose-400',
  },
  {
    pillar: 'curiosity' as const,
    label: '🧠 For My Curiosity',
    color: 'text-indigo-400',
    divider: 'from-indigo-500/50 to-transparent',
    countClass: 'bg-indigo-500/10 text-indigo-400',
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  error?: Error;
  groupBy: 'pillar' | 'flat';
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TaskSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-800 p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ groupBy }: { groupBy: 'pillar' | 'flat' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">📋</div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">No tasks yet</h3>
      <p className="text-sm text-zinc-500 max-w-sm">
        {groupBy === 'pillar'
          ? 'Add your first task to start building your life schedule across pillars.'
          : 'No tasks match the current filters. Try adjusting your selection.'}
      </p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
      <p className="text-rose-400 font-medium">Failed to load tasks</p>
      <p className="text-sm text-rose-400/70 mt-1">{message}</p>
    </div>
  );
}

// ─── Pillar Section Header ────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  count: number;
  color: string;
  divider: string;
  countClass: string;
}

function SectionHeader({ label, count, color, divider, countClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className={cn('text-sm font-semibold tracking-wide uppercase', color)}>{label}</h2>
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', countClass)}>
        {count}
      </span>
      <div className={cn('flex-1 h-px bg-gradient-to-r', divider)} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskList({
  tasks,
  isLoading,
  error,
  groupBy,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (isLoading) return <TaskSkeletonGrid />;
  if (error) return <ErrorState message={error.message} />;
  if (tasks.length === 0) return <EmptyState groupBy={groupBy} />;

  // ── Flat view ──────────────────────────────────────────────────────────────
  if (groupBy === 'flat') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    );
  }

  // ── Grouped by pillar view ─────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {PILLAR_SECTIONS.map((section) => {
        const pillarTasks = tasks.filter((t) => t.pillar === section.pillar);

        return (
          <section key={section.pillar} id={`pillar-section-${section.pillar}`}>
            <SectionHeader
              label={section.label}
              count={pillarTasks.length}
              color={section.color}
              divider={section.divider}
              countClass={section.countClass}
            />

            {pillarTasks.length === 0 ? (
              <p className="text-sm text-zinc-600 pl-1 py-4">
                No {section.label.split(' ')[1]} tasks yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pillarTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
