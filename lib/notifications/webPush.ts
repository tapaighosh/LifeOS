/**
 * lib/notifications/webPush.ts
 *
 * Server-side Web Push notification utilities.
 * - Saves/retrieves push subscriptions from UserSettings
 * - Sends morning-reminder and night-checkin pushes
 *
 * VAPID keys are read from env vars — never hardcoded.
 */

import webpush from 'web-push';
import dbConnect from '@/lib/db/mongoose';
import UserSettings, { IUserSettings } from '@/models/UserSettings';

// ---------------------------------------------------------------------------
// VAPID configuration (set once per server process)
// ---------------------------------------------------------------------------
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@lifeos.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// Send a push notification to the stored subscription
// ---------------------------------------------------------------------------
export async function sendPushNotification(
  subscription: PushSubscriptionPayload,
  payload: NotificationPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[webPush] VAPID keys not configured — skipping push notification.');
    return;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    // 410 Gone = subscription expired/unsubscribed → clear it
    if (err.statusCode === 410) {
      await clearPushSubscription();
    }
    console.error('[webPush] sendNotification failed:', err.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Persist subscription in UserSettings (single-user app)
// ---------------------------------------------------------------------------
export async function savePushSubscription(
  subscription: PushSubscriptionPayload
): Promise<void> {
  await dbConnect();
  await UserSettings.findOneAndUpdate(
    {},
    { push_subscription: subscription },
    { upsert: true, new: true }
  );
}

// ---------------------------------------------------------------------------
// Retrieve stored subscription
// ---------------------------------------------------------------------------
export async function getPushSubscription(): Promise<PushSubscriptionPayload | null> {
  await dbConnect();
  const settings = await UserSettings.findOne({}, 'push_subscription').lean<
    IUserSettings & { push_subscription?: PushSubscriptionPayload }
  >();
  return settings?.push_subscription ?? null;
}

// ---------------------------------------------------------------------------
// Clear subscription (user unsubscribed or subscription expired)
// ---------------------------------------------------------------------------
export async function clearPushSubscription(): Promise<void> {
  await dbConnect();
  await UserSettings.findOneAndUpdate({}, { $unset: { push_subscription: 1 } });
}

// ---------------------------------------------------------------------------
// Pre-built notification payloads
// ---------------------------------------------------------------------------
export const MORNING_NOTIFICATION: NotificationPayload = {
  title: '🌅 Good morning, Ty!',
  body: 'Your day is ready to plan. Tap to generate today\'s schedule.',
  url: '/dashboard',
  tag: 'morning-reminder',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-96x96.png',
};

export const NIGHT_NOTIFICATION: NotificationPayload = {
  title: '🌙 Night check-in',
  body: 'Time to log your day and get tomorrow\'s preview.',
  url: '/checkin',
  tag: 'night-checkin',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/icon-96x96.png',
};
