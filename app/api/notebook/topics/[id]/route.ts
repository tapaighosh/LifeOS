import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import NotebookTopic from '@/models/NotebookTopic';
import NotebookEntry from '@/models/NotebookEntry';
import { NotebookTopicSchema } from '@/lib/validators/notebook';

/**
 * PATCH /api/notebook/topics/[id]
 * Partially updates a topic (title, icon, color, pinned).
 *
 * Body: Partial<{ title, icon, color, pinned }>
 * Response 200: { topic: INotebookTopic }
 * Response 404: { error: 'Topic not found' }
 *
 * DELETE /api/notebook/topics/[id]
 * Cascade-deletes all entries under the topic, then the topic itself.
 *
 * Response 200: { ok: true }
 * Response 404: { error: 'Topic not found' }
 */

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const parsed = NotebookTopicSchema.partial().safeParse(body);

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

    const topic = await NotebookTopic.findByIdAndUpdate(
      id,
      parsed.data,
      { new: true }
    ).lean();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/notebook/topics/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update topic', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
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

    // Verify topic exists before cascading
    const topic = await NotebookTopic.findById(id).lean();
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Cascade: remove all entries belonging to this topic first
    await NotebookEntry.deleteMany({ topic_id: id });

    // Then remove the topic itself
    await NotebookTopic.findByIdAndDelete(id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/notebook/topics/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete topic', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
