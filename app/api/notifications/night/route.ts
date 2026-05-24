/**
 * app/api/notifications/night/route.ts
 *
 * Vercel Cron endpoint — triggers night check-in push notification.
 * Schedule: 16:00 UTC every day (= 21:30 IST)
 * Cron string in vercel.json: "0 16 * * *"
 */

import { NextResponse } from 'next/server';
import {
  getPushSubscription,
  sendPushNotification,
  NIGHT_NOTIFICATION,
} from '@/lib/notifications/webPush';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      return NextResponse.json({ message: 'No subscription registered' });
    }
    await sendPushNotification(subscription, NIGHT_NOTIFICATION);
    return NextResponse.json({ success: true, type: 'night' });
  } catch (error) {
    console.error('[cron/night] error:', error);
    return NextResponse.json({ error: 'Failed to send night notification' }, { status: 500 });
  }
}
