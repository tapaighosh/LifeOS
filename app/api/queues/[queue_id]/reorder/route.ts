/**
 * PATCH /api/queues/[queue_id]/reorder
 *
 * Bulk updates the `order` field for a set of items in a single queue.
 *
 * WHY covered items are rejected:
 *   Covered items represent completed history — their position relative to
 *   each other is immutable (it reflects the actual order things were learned).
 *   Allowing reorder of covered items would corrupt the historical record and
 *   confuse revision scheduling. Only pending/skipped items can be reordered
 *   because their order represents *intended future study sequence*.
 *
 * WHY Promise.all instead of a single bulkWrite:
 *   Each updateOne is a targeted single-document operation. Using Promise.all
 *   gives us concurrency without requiring MongoDB transactions, and the
 *   checked items list is validated before any update runs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicItem from '@/models/TopicItem';
import { reorderSchema } from '@/lib/validators/queue';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ queue_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const { queue_id } = await params;

    const body = await request.json();
    const parsed = reorderSchema.safeParse({ ...body, queue_id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items } = parsed.data;
    const ids = items.map((i) => i.id);

    // Guard: reject if any item in the payload is 'covered' (history is immutable)
    const coveredCount = await TopicItem.countDocuments({
      _id: { $in: ids },
      queue_id,
      status: 'covered',
    });

    if (coveredCount > 0) {
      return NextResponse.json(
        { error: 'Cannot reorder covered items — completed history is immutable', code: 'REORDER_LOCKED' },
        { status: 400 }
      );
    }

    // Bulk update — all parallel, then settle
    await Promise.all(
      items.map(({ id, order }) =>
        TopicItem.updateOne({ _id: id, queue_id }, { $set: { order } })
      )
    );

    return NextResponse.json({ updated: items.length });
  } catch (error) {
    console.error('[PATCH /api/queues/[queue_id]/reorder]', error);
    return NextResponse.json({ error: 'Failed to reorder items', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
