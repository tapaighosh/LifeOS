/**
 * app/api/notifications/subscribe/route.ts
 *
 * Saves a browser Push subscription to UserSettings.
 * Called client-side after the user grants notification permission.
 *
 * POST  /api/notifications/subscribe   { endpoint, keys: { p256dh, auth } }
 * DELETE /api/notifications/subscribe   — removes subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  savePushSubscription,
  clearPushSubscription,
  PushSubscriptionPayload,
} from '@/lib/notifications/webPush';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// ---------------------------------------------------------------------------
// POST — save subscription
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid subscription payload', code: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await savePushSubscription(parsed.data as PushSubscriptionPayload);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[notifications/subscribe] POST error:', error);
    return NextResponse.json({ error: 'Failed to save subscription', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — clear subscription (user disabled notifications)
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await clearPushSubscription();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications/subscribe] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear subscription', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
