/**
 * app/api/notifications/send/route.ts
 *
 * Triggers a push notification to the stored subscription.
 * Called by Vercel Cron Jobs (or manually for testing).
 *
 * POST /api/notifications/send  { type: "morning" | "night" }
 *
 * Protected by CRON_SECRET header to prevent unauthorized triggers.
 * Vercel cron jobs send: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPushSubscription,
  sendPushNotification,
  MORNING_NOTIFICATION,
  NIGHT_NOTIFICATION,
} from '@/lib/notifications/webPush';
import { z } from 'zod';

const sendSchema = z.object({
  type: z.enum(['morning', 'night']),
});

export async function POST(req: NextRequest) {
  // Validate CRON_SECRET (or allow if running in dev without it configured)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const subscription = await getPushSubscription();
    if (!subscription) {
      return NextResponse.json({ message: 'No active subscription' }, { status: 200 });
    }

    const payload = parsed.data.type === 'morning' ? MORNING_NOTIFICATION : NIGHT_NOTIFICATION;
    await sendPushNotification(subscription, payload);

    return NextResponse.json({ success: true, type: parsed.data.type });
  } catch (error) {
    console.error('[notifications/send] error:', error);
    return NextResponse.json({ error: 'Failed to send notification', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
