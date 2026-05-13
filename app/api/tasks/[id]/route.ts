/**
 * PATCH  /api/tasks/[id] — Partial update of a task (all fields optional)
 * DELETE /api/tasks/[id] — Soft delete: sets active=false (data is never removed)
 *
 * Both routes require a valid NextAuth session.
 *
 * Example PATCH request body:
 * { title: "Updated title", priority: 5 }
 *
 * Example DELETE response:
 * { message: "Task deactivated", id: "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';
import Challenge from '@/models/Challenge';
import { taskUpdateSchema } from '@/lib/validators/task';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PATCH /api/tasks/[id] ────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ObjectId format before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const parseResult = taskUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { $set: parseResult.data },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/tasks/${params.id}]`, error);
    return NextResponse.json(
      { error: 'Failed to update task', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tasks/[id] ───────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Soft-delete guard: if this task is linked to an active challenge, auto-pause it.
    // This prevents orphaned challenges with no linked task.
    let pausedChallenge: string | null = null;
    const linkedChallenge = await Challenge.findOne({
      linked_task_id: id,
      status: 'active',
    });
    if (linkedChallenge) {
      linkedChallenge.status = 'paused';
      await linkedChallenge.save();
      pausedChallenge = linkedChallenge.title;
    }

    // Soft delete — set active=false so task history is preserved
    const deleted = await Task.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Task deactivated', id, paused_challenge: pausedChallenge },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[DELETE /api/tasks/${params.id}]`, error);
    return NextResponse.json(
      { error: 'Failed to delete task', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
