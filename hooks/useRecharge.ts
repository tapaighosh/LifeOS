import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback } from 'react';
import type { RechargeCreate, RechargeUpdate } from '@/lib/validators/recharge';

export interface RechargeItem {
  _id: string;
  title: string;
  duration: number;
  favourite: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const BASE_KEY = '/api/recharge';

async function fetcher(url: string): Promise<RechargeItem[]> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to fetch recharge items');
  }
  return res.json();
}

export function useRecharge() {
  const { data: items, error, isLoading } = useSWR<RechargeItem[]>(BASE_KEY, fetcher, {
    revalidateOnFocus: false,
  });

  const createItem = useCallback(
    async (data: RechargeCreate): Promise<RechargeItem> => {
      const res = await fetch(BASE_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create recharge item');
      }

      const created: RechargeItem = await res.json();

      await globalMutate(BASE_KEY);

      return created;
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, data: RechargeUpdate): Promise<RechargeItem> => {
      const res = await fetch(`${BASE_KEY}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update recharge item');
      }

      const updated: RechargeItem = await res.json();

      await globalMutate(
        BASE_KEY,
        (prev: RechargeItem[] | undefined) =>
          prev?.map((t) => (t._id === id ? { ...t, ...updated } : t)) ?? [],
        { revalidate: false }
      );

      return updated;
    },
    []
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${BASE_KEY}/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete recharge item');
      }

      await globalMutate(
        BASE_KEY,
        (prev: RechargeItem[] | undefined) => prev?.filter((t) => t._id !== id) ?? [],
        { revalidate: false }
      );
    },
    []
  );

  const toggleFavourite = useCallback(
    async (id: string, currentFavourite: boolean): Promise<void> => {
      // Optimistic UI update
      await globalMutate(
        BASE_KEY,
        (prev: RechargeItem[] | undefined) =>
          prev?.map((t) => (t._id === id ? { ...t, favourite: !currentFavourite } : t)) ?? [],
        { revalidate: false }
      );

      try {
        await updateItem(id, { favourite: !currentFavourite });
      } catch (error) {
        // Revert on failure
        await globalMutate(BASE_KEY);
        throw error;
      }
    },
    [updateItem]
  );

  return {
    items: items ?? [],
    isLoading,
    error: error as Error | undefined,
    createItem,
    updateItem,
    deleteItem,
    toggleFavourite,
  };
}
