/**
 * GET /api/queues/[queue_id]?tab=pending|covered|skipped|all
 *   Returns queue + items filtered by tab param, sorted by order ASC
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicQueue from '@/models/TopicQueue';
import TopicItem from '@/models/TopicItem';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') ?? 'all';

    const queue = await TopicQueue.findById(queue_id).lean();
    if (!queue) {
      return NextResponse.json({ error: 'Queue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Build query filter based on tab
    // 'skipped' tab = pending items where skip_count > 0 (status stays 'pending' after skip)
    let filter: Record<string, unknown>;
    if (tab === 'pending') {
      filter = {
        queue_id,
        $or: [
          { status: 'in_progress' },
          { status: 'pending', skip_count: { $in: [0, null] } },
          { status: 'pending', skip_count: { $exists: false } }
        ]
      };
    } else if (tab === 'covered') {
      filter = { queue_id, status: 'covered' };
    } else if (tab === 'skipped') {
      filter = { queue_id, status: 'pending', skip_count: { $gt: 0 } };
    } else if (tab === 'in_progress') {
      filter = { queue_id, status: 'in_progress' };
    } else {
      // 'all' — include every item
      filter = { queue_id };
    }

    const items = await TopicItem.find(filter).sort({ order: 1 }).lean();

    return NextResponse.json({ queue, items });
  } catch (error) {
    console.error('[GET /api/queues/[queue_id]]', error);
    return NextResponse.json({ error: 'Failed to fetch queue', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
