/**
 * app/api/notifications/morning/route.ts
 *
 * Vercel Cron endpoint — triggers morning push notification.
 * Schedule: 00:45 UTC every day (= 06:15 IST)
 * Cron string in vercel.json: "45 0 * * *"
 */

import { NextResponse } from 'next/server';
import {
  getPushSubscription,
  sendPushNotification,
  MORNING_NOTIFICATION,
} from '@/lib/notifications/webPush';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      return NextResponse.json({ message: 'No subscription registered' });
    }
    await sendPushNotification(subscription, MORNING_NOTIFICATION);
    return NextResponse.json({ success: true, type: 'morning' });
  } catch (error) {
    console.error('[cron/morning] error:', error);
    return NextResponse.json({ error: 'Failed to send morning notification' }, { status: 500 });
  }
}
