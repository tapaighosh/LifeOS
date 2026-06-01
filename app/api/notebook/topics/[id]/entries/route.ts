import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import NotebookEntry from '@/models/NotebookEntry';
import NotebookTopic from '@/models/NotebookTopic';
import { NotebookEntrySchema } from '@/lib/validators/notebook';

/**
 * GET /api/notebook/topics/[id]/entries
 * Returns the 50 most recent entries for a topic.
 *
 * Response 200: { entries: INotebookEntry[] }
 *
 * POST /api/notebook/topics/[id]/entries
 * Creates a new entry under the topic and atomically updates the topic's
 * entry_count (+1) and last_entry_on (today's YYYY-MM-DD date string).
 *
 * Body: { body, source?, tags? }
 * Response 201: { entry: INotebookEntry }
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    await connectDB();

    const entries = await NotebookEntry.find({ topic_id: id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/notebook/topics/[id]/entries]', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    await connectDB();

    const body = await request.json();
    const parsed = NotebookEntrySchema.safeParse(body);

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

    // Stable local date string — consistent with the principles today pattern
    const today = new Date().toISOString().split('T')[0];

    // Atomically create the entry and update topic stats in parallel
    const [entry] = await Promise.all([
      NotebookEntry.create({ topic_id: id, ...parsed.data }),
      NotebookTopic.findByIdAndUpdate(id, {
        $inc: { entry_count: 1 },
        $set: { last_entry_on: today },
      }),
    ]);

    return NextResponse.json({ entry: entry.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notebook/topics/[id]/entries]', error);
    return NextResponse.json(
      { error: 'Failed to create entry', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
