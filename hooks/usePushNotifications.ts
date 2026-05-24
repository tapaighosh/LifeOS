/**
 * hooks/usePushNotifications.ts
 *
 * Client-side hook that manages the full notification permission lifecycle:
 *  1. Check current browser permission state
 *  2. Request permission (shown on first visit)
 *  3. Subscribe to push and POST subscription to the server
 *  4. Persist subscription status to avoid re-prompting
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushNotificationState {
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Convert a VAPID base64url key to Uint8Array for the browser API */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(): PushNotificationState {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialise state from current browser permission
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);

    // Check if a push subscription already exists
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    );
  }, []);

  /** Subscribe the browser and persist subscription to the server */
  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[usePushNotifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    const sub = subscription.toJSON();
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }),
    });

    setIsSubscribed(true);
  }, []);

  /** Request permission and subscribe if granted */
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result === 'granted') {
        await subscribe();
      }
    } catch (error) {
      console.error('[usePushNotifications] requestPermission error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscribe]);

  /** Unsubscribe from push and remove server-side subscription */
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch('/api/notifications/subscribe', { method: 'DELETE' });
      setIsSubscribed(false);
    } catch (error) {
      console.error('[usePushNotifications] unsubscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, requestPermission, unsubscribe };
}
