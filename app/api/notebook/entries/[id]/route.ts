import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import NotebookEntry from '@/models/NotebookEntry';
import NotebookTopic from '@/models/NotebookTopic';
import { NotebookEntrySchema } from '@/lib/validators/notebook';

/**
 * PATCH /api/notebook/entries/[id]
 * Partially updates an entry (body, source, tags).
 *
 * Body: Partial<{ body, source, tags }>
 * Response 200: { entry: INotebookEntry }
 * Response 404: { error: 'Entry not found' }
 *
 * DELETE /api/notebook/entries/[id]
 * Deletes an entry and decrements its parent topic's entry_count.
 *
 * Response 200: { ok: true }
 * Response 404: { error: 'Entry not found' }
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
    const parsed = NotebookEntrySchema.partial().safeParse(body);

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

    const entry = await NotebookEntry.findByIdAndUpdate(
      id,
      parsed.data,
      { new: true }
    ).lean();

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/notebook/entries/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update entry', code: 'INTERNAL_ERROR' },
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

    // Fetch entry first so we can access topic_id for the counter decrement
    const entry = await NotebookEntry.findByIdAndDelete(id).lean();

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Decrement parent topic's entry_count — clamp at 0 to guard against drift
    await NotebookTopic.findByIdAndUpdate(entry.topic_id, {
      $inc: { entry_count: -1 },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/notebook/entries/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete entry', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
