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

    // Build status filter based on tab
    const statusMap: Record<string, string | string[]> = {
      pending: 'pending',
      covered: 'covered',
      skipped: 'skipped',
      in_progress: 'in_progress',
      all: ['pending', 'in_progress', 'covered', 'skipped'],
    };

    const statusFilter = statusMap[tab] ?? ['pending', 'in_progress', 'covered', 'skipped'];
    const filter = Array.isArray(statusFilter)
      ? { queue_id, status: { $in: statusFilter } }
      : { queue_id, status: statusFilter };

    const items = await TopicItem.find(filter).sort({ order: 1 }).lean();

    return NextResponse.json({ queue, items });
  } catch (error) {
    console.error('[GET /api/queues/[queue_id]]', error);
    return NextResponse.json({ error: 'Failed to fetch queue', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
