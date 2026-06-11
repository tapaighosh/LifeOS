/**
 * PATCH /api/queues/[queue_id]/items/[item_id]
 *
 * Three code paths:
 *  1. action === 'skip'
 *       - Keep status as 'pending' (do NOT set to 'skipped')
 *       - Increment skip_count by 1, set last_skipped_on = today
 *       - Move to END of pending queue (sort_order = max + 1)
 *  2. action === 'move_to_top'
 *       - Keep status as 'pending'
 *       - Set sort_order = (min existing order - 1), or 0 if first
 *  3. status === 'covered' → advanceQueueItem() for state machine
 *  4. Field update (notes, approach_notes, etc.) → direct update
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

    const { status, action, ...fieldUpdates } = parsed.data;

    if (action === 'skip') {
      // ── Skip: keep pending, increment skip_count, requeue at end ─────────
      const today = new Date().toISOString().split('T')[0];

      // Find the current maximum sort_order among pending items in this queue
      const maxOrderItem = await TopicItem.findOne({ queue_id, status: 'pending' })
        .sort({ order: -1 })
        .lean();
      const newOrder = (maxOrderItem?.order ?? 0) + 1;

      await TopicItem.findByIdAndUpdate(item_id, {
        $inc: { skip_count: 1 },
        $set: {
          last_skipped_on: today,
          order: newOrder,
        },
      });

    } else if (action === 'move_to_top') {
      // ── Move to top: set order to min - 1 (or 0 if queue is empty) ───────
      const minOrderItem = await TopicItem.findOne({ queue_id, status: 'pending' })
        .sort({ order: 1 })
        .lean();
      const newOrder = minOrderItem ? minOrderItem.order - 1 : 0;

      await TopicItem.findByIdAndUpdate(item_id, {
        $set: { order: newOrder },
      });

    } else if (status === 'covered') {
      // ── Covered: go through the queue engine to maintain invariants ───────
      const today = new Date().toISOString().split('T')[0];
      await advanceQueueItem(item_id, 'covered', today);

    } else if (status === 'skipped') {
      // Legacy path — treat as skip (increment skip_count, stay pending)
      const today = new Date().toISOString().split('T')[0];
      const maxOrderItem = await TopicItem.findOne({ queue_id, status: 'pending' })
        .sort({ order: -1 })
        .lean();
      const newOrder = (maxOrderItem?.order ?? 0) + 1;

      await TopicItem.findByIdAndUpdate(item_id, {
        $inc: { skip_count: 1 },
        $set: {
          last_skipped_on: today,
          order: newOrder,
        },
      });

    } else if (Object.keys(fieldUpdates).length > 0) {
      // ── Field update (notes, DSA fields, revision flag) ───────────────────
      await TopicItem.updateOne({ _id: item_id }, { $set: fieldUpdates });
    }

    const updated = await TopicItem.findById(item_id).lean();
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('[PATCH /api/queues/[queue_id]/items/[item_id]]', error);
    return NextResponse.json({ error: 'Failed to update item', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
