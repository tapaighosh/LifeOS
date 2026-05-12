/**
 * PATCH /api/queues/[queue_id]/items/[item_id]
 *
 * Two code paths:
 *  1. Status change (covered | skipped) → calls advanceQueueItem() which
 *     enforces the one-in_progress invariant and schedules revision if needed.
 *  2. Field update (notes, approach_notes, time_taken, etc.) → direct update,
 *     no state machine involvement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicItem from '@/models/TopicItem';
import { advanceQueueItem } from '@/lib/queues/queueEngine';
import { topicItemUpdateSchema } from '@/lib/validators/queue';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ queue_id: string; item_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const { queue_id, item_id } = await params;

    const item = await TopicItem.findOne({ _id: item_id, queue_id });
    if (!item) {
      return NextResponse.json({ error: 'Item not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = topicItemUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, ...fieldUpdates } = parsed.data;

    if (status === 'covered' || status === 'skipped') {
      // Status change — go through the queue engine to maintain invariants
      const today = new Date().toISOString().split('T')[0];
      await advanceQueueItem(item_id, status, today);
    } else if (Object.keys(fieldUpdates).length > 0) {
      // Direct field update (notes, DSA fields, revision flag)
      await TopicItem.updateOne({ _id: item_id }, { $set: fieldUpdates });
    }

    const updated = await TopicItem.findById(item_id).lean();
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('[PATCH /api/queues/[queue_id]/items/[item_id]]', error);
    return NextResponse.json({ error: 'Failed to update item', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
