import useSWR from 'swr';
import { useCallback } from 'react';
import type { IDailyPlan, IPlanEntry } from '@/models/DailyPlan';

const API_TODAY = '/api/plan/today';
const API_GENERATE = '/api/plan/generate';
const API_REORDER = '/api/plan/reorder';
const API_LOCK = '/api/plan/lock';

async function fetcher(url: string): Promise<IDailyPlan | null> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to fetch plan');
  }
  return res.json(); // Returns null if 404 (handled by backend returning 200 with null)
}

export function usePlan() {
  const { data: plan, error, isLoading, mutate } = useSWR<IDailyPlan | null>(API_TODAY, fetcher, {
    revalidateOnFocus: false,
  });

  const generatePlan = useCallback(async (date: string) => {
    const res = await fetch(API_GENERATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to generate plan');
    }

    const newPlan = await res.json();
    await mutate(newPlan, false);
    return newPlan;
  }, [mutate]);

  const reorderPlan = useCallback(async (date: string, newPlan: IPlanEntry[]) => {
    // Optimistic update
    mutate((prev) => prev ? { ...prev, plan: newPlan } as IDailyPlan : prev, false);

    const res = await fetch(API_REORDER, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, newPlan }),
    });

    if (!res.ok) {
      mutate(); // Revert
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to reorder plan');
    }
  }, [mutate]);

  const lockPlan = useCallback(async (date: string, locked: boolean) => {
    mutate((prev) => prev ? { ...prev, locked } as IDailyPlan : prev, false);

    const res = await fetch(API_LOCK, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, locked }),
    });

    if (!res.ok) {
      mutate(); // Revert
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to lock plan');
    }
  }, [mutate]);

  return {
    plan,
    isLoading,
    error: error as Error | undefined,
    generatePlan,
    reorderPlan,
    lockPlan,
  };
}
