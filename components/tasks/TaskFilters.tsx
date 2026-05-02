'use client';

/**
 * TaskFilters — filter bar for the Task Management page.
 *
 * Provides pill-style toggle filters for:
 *  - Pillar (All | Money | Soul | Curiosity)
 *  - Task Type (All | Recurring | One-time | Project | Recharge)
 *  - Energy Level (All | High | Medium | Low)
 *
 * Active filter chips are highlighted with pillar colors or zinc tones.
 * Designed to scroll horizontally on mobile.
 */

import { cn } from '@/lib/utils';
import type { UseTasksFilters } from '@/hooks/useTasks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskFiltersProps {
  filters: UseTasksFilters;
  onChange: (filters: UseTasksFilters) => void;
}

// ─── Filter Definitions ───────────────────────────────────────────────────────

const PILLAR_OPTIONS = [
  { value: undefined, label: 'All Pillars' },
  { value: 'money' as const, label: '💰 Money', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'soul' as const, label: '🔥 Soul', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { value: 'curiosity' as const, label: '🧠 Curiosity', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
];

const TYPE_OPTIONS = [
  { value: undefined, label: 'All Types' },
  { value: 'recurring' as const, label: 'Recurring' },
  { value: 'one-time' as const, label: 'One-time' },
  { value: 'project' as const, label: 'Project' },
  { value: 'recharge' as const, label: '⚡ Recharge' },
];

const ENERGY_OPTIONS = [
  { value: undefined, label: 'All Energy' },
  { value: 'high' as const, label: '🔴 High', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { value: 'medium' as const, label: '🟡 Medium', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'low' as const, label: '🟢 Low', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
];

// ─── Filter Chip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  activeClass?: string;
  onClick: () => void;
  id: string;
}

function FilterChip({ label, active, activeClass, onClick, id }: FilterChipProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
        active
          ? activeClass ?? 'bg-zinc-700 text-zinc-100 border-zinc-600'
          : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
      )}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Pillar row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs text-zinc-600 w-16">Pillar</span>
        {PILLAR_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.label}
            id={`filter-pillar-${opt.value ?? 'all'}`}
            label={opt.label}
            active={filters.pillar === opt.value}
            activeClass={opt.activeClass}
            onClick={() => onChange({ ...filters, pillar: opt.value })}
          />
        ))}
      </div>

      {/* Type row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs text-zinc-600 w-16">Type</span>
        {TYPE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.label}
            id={`filter-type-${opt.value ?? 'all'}`}
            label={opt.label}
            active={filters.type === opt.value}
            onClick={() => onChange({ ...filters, type: opt.value })}
          />
        ))}
      </div>

      {/* Energy row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs text-zinc-600 w-16">Energy</span>
        {ENERGY_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.label}
            id={`filter-energy-${opt.value ?? 'all'}`}
            label={opt.label}
            active={filters.energy_cost === opt.value}
            activeClass={opt.activeClass}
            onClick={() => onChange({ ...filters, energy_cost: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}
