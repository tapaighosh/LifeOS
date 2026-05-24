/**
 * POST /api/queues/[queue_id]/items
 *   Adds a new topic item at the end of the queue (order = maxOrder + 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicQueue from '@/models/TopicQueue';
import TopicItem from '@/models/TopicItem';
import { topicItemCreateSchema } from '@/lib/validators/queue';

export async function POST(
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

    const queue = await TopicQueue.findById(queue_id);
    if (!queue) {
      return NextResponse.json({ error: 'Queue not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = topicItemCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Find the current max order to append at the end
    const last = await TopicItem.findOne({ queue_id }).sort({ order: -1 }).lean();
    const order = last ? last.order + 1 : 0;

    const item = await TopicItem.create({
      queue_id,
      title: parsed.data.title,
      difficulty: parsed.data.difficulty,
      order,
      status: 'pending',
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/queues/[queue_id]/items]', error);
    return NextResponse.json({ error: 'Failed to add item', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
