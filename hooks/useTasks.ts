/**
 * useTasks — SWR hook for Task CRUD operations
 *
 * Provides:
 *  - tasks: Task[]         — live data from GET /api/tasks (auto-revalidated)
 *  - isLoading / error     — standard SWR status flags
 *  - createTask()          — POST, then mutate cache optimistically
 *  - updateTask()          — PATCH, then mutate cache optimistically
 *  - deleteTask()          — DELETE (soft), then mutate cache
 *  - filters               — reactive query params (pillar, type, energy_cost)
 *  - setFilters()          — update filters, triggers re-fetch
 *
 * Cache key pattern: SWR_KEYS.TASKS + serialized query string
 * so filtered views maintain independent caches.
 */

'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { useState, useCallback } from 'react';
import type { TaskCreate, TaskUpdate, TaskQuery } from '@/lib/validators/task';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Task {
  _id: string;
  title: string;
  pillar: 'money' | 'soul' | 'curiosity';
  category?: string;
  type: 'recurring' | 'one-time' | 'project' | 'recharge';
  duration: 15 | 30 | 45 | 60 | 90 | 120;
  energy_cost: 'high' | 'medium' | 'low';
  slot_preference: 'morning' | 'evening' | 'any';
  frequency?: 'daily' | 'alternate' | '3x_week' | 'weekly' | 'custom';
  revision: boolean;
  revision_cycle: number[];
  priority: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UseTasksFilters {
  pillar?: 'money' | 'soul' | 'curiosity';
  type?: 'recurring' | 'one-time' | 'project' | 'recharge';
  energy_cost?: 'high' | 'medium' | 'low';
}

// ─── SWR Cache Key ────────────────────────────────────────────────────────────

const BASE_KEY = '/api/tasks';

function buildKey(filters: UseTasksFilters): string {
  const params = new URLSearchParams();
  if (filters.pillar) params.set('pillar', filters.pillar);
  if (filters.type) params.set('type', filters.type);
  if (filters.energy_cost) params.set('energy_cost', filters.energy_cost);
  const qs = params.toString();
  return qs ? `${BASE_KEY}?${qs}` : BASE_KEY;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetcher(url: string): Promise<Task[]> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to fetch tasks');
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTasks(initialFilters: UseTasksFilters = {}) {
  const [filters, setFiltersState] = useState<UseTasksFilters>(initialFilters);
  const key = buildKey(filters);

  const { data: tasks, error, isLoading } = useSWR<Task[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  /** Update filters — triggers re-fetch via new SWR key */
  const setFilters = useCallback((next: UseTasksFilters) => {
    setFiltersState(next);
  }, []);

  // ─── CRUD Helpers ───────────────────────────────────────────────────────────

  /** POST /api/tasks — creates task and revalidates all task caches */
  const createTask = useCallback(
    async (data: TaskCreate): Promise<Task> => {
      const res = await fetch(BASE_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create task');
      }

      const created: Task = await res.json();

      // Revalidate current filtered view and the unfiltered base key
      await mutateTaskCaches();

      return created;
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** PATCH /api/tasks/:id — partial update, optimistic cache update */
  const updateTask = useCallback(
    async (id: string, data: TaskUpdate): Promise<Task> => {
      const res = await fetch(`${BASE_KEY}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update task');
      }

      const updated: Task = await res.json();

      // Optimistic update in current SWR cache
      await globalMutate(
        key,
        (prev: Task[] | undefined) =>
          prev?.map((t) => (t._id === id ? { ...t, ...updated } : t)) ?? [],
        { revalidate: false }
      );

      return updated;
    },
    [key]
  );

  /** DELETE /api/tasks/:id — soft delete, removes from current view */
  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${BASE_KEY}/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete task');
      }

      // Remove from local cache immediately (optimistic)
      await globalMutate(
        key,
        (prev: Task[] | undefined) => prev?.filter((t) => t._id !== id) ?? [],
        { revalidate: false }
      );
    },
    [key]
  );

  return {
    tasks: tasks ?? [],
    isLoading,
    error: error as Error | undefined,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
  };
}

// ─── Utility: revalidate all task SWR caches ─────────────────────────────────

async function mutateTaskCaches() {
  // Revalidate the unfiltered list and let SWR cascade to filtered views
  await globalMutate(
    (key: unknown) => typeof key === 'string' && key.startsWith(BASE_KEY),
    undefined,
    { revalidate: true }
  );
}

export type { TaskCreate, TaskUpdate, TaskQuery };
