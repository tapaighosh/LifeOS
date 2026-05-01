import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback } from 'react';
import type { SettingsUpdate } from '@/lib/validators/settings';

export interface UserSettings {
  _id: string;
  wake_time: string;
  sleep_time: string;
  leave_time: string;
  return_time: string;
  notification_morning: string;
  notification_night: string;
  timezone: string;
  days_off: number[];
  pillar_balance_target: {
    money: number;
    soul: number;
    curiosity: number;
  };
}

const BASE_KEY = '/api/settings';

async function fetcher(url: string): Promise<UserSettings> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to fetch settings');
  }
  return res.json();
}

export function useSettings() {
  const { data: settings, error, isLoading } = useSWR<UserSettings>(BASE_KEY, fetcher, {
    revalidateOnFocus: false,
  });

  const updateSettings = useCallback(
    async (data: SettingsUpdate): Promise<UserSettings> => {
      const res = await fetch(BASE_KEY, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update settings');
      }

      const updated: UserSettings = await res.json();

      await globalMutate(
        BASE_KEY,
        (prev: UserSettings | undefined) => (prev ? { ...prev, ...updated } : updated),
        { revalidate: false }
      );

      return updated;
    },
    []
  );

  return {
    settings,
    isLoading,
    error: error as Error | undefined,
    updateSettings,
  };
}
