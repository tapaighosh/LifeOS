/**
 * GET  /api/queues  — list all active queues with per-queue progress counts
 * POST /api/queues  — create a custom queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicQueue from '@/models/TopicQueue';
import TopicItem from '@/models/TopicItem';
import { topicQueueCreateSchema } from '@/lib/validators/queue';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const queues = await TopicQueue.find({ active: true }).lean();

    // Attach progress counts for each queue
    const result = await Promise.all(
      queues.map(async (queue) => {
        const [covered, inProgress, skipped] = await Promise.all([
          TopicItem.countDocuments({ queue_id: queue._id, status: 'covered' }),
          TopicItem.countDocuments({ queue_id: queue._id, status: 'in_progress' }),
          // 'Skipped' = pending items where skip_count > 0
          TopicItem.countDocuments({ queue_id: queue._id, status: 'pending', skip_count: { $gt: 0 } }),
        ]);
        const pending = await TopicItem.countDocuments({ queue_id: queue._id, status: 'pending' });

        return {
          queue,
          progress: {
            covered,
            pending,
            skipped,
            in_progress: inProgress,
            total: covered + pending + inProgress,
          },
        };
      })
    );

    return NextResponse.json({ queues: result });
  } catch (error) {
    console.error('[GET /api/queues]', error);
    return NextResponse.json({ error: 'Failed to fetch queues', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parsed = topicQueueCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const queue = await TopicQueue.create({ ...parsed.data, active: true });

    return NextResponse.json({ queue }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/queues]', error);
    return NextResponse.json({ error: 'Failed to create queue', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
