import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import NotebookTopic from '@/models/NotebookTopic';
import { NotebookTopicSchema } from '@/lib/validators/notebook';

/**
 * GET /api/notebook/topics
 * Returns all active topics, pinned first, most recently updated first.
 *
 * Response 200: { topics: INotebookTopic[] }
 *
 * POST /api/notebook/topics
 * Creates a new notebook topic.
 *
 * Body: { title, icon, color, pinned? }
 * Response 201: { topic: INotebookTopic }
 */

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    const topics = await NotebookTopic.find({ active: true })
      .sort({ pinned: -1, last_entry_on: -1 })
      .lean();

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/notebook/topics]', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const parsed = NotebookTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const topic = await NotebookTopic.create({
      ...parsed.data,
      user_id: 'default',
    });

    return NextResponse.json({ topic: topic.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notebook/topics]', error);
    return NextResponse.json(
      { error: 'Failed to create topic', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
