/**
 * GET  /api/challenges/[id] — Fetch a single challenge with populated task
 * PATCH /api/challenges/[id] — Update status or notes
 *
 * Status transitions:
 *   dropped → also deactivates linked task (soft delete)
 *   paused  → task stays active (user can still do it manually)
 *   active  → resume a paused challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Challenge from '@/models/Challenge';
import Task from '@/models/Task';
import { challengeUpdateSchema } from '@/lib/validators/challenge';

interface RouteParams {
  params: { id: string };
}

// ─── GET /api/challenges/[id] ─────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID', code: 'INVALID_ID' }, { status: 400 });
    }

    await connectDB();

    const challenge = await Challenge.findById(id)
      .populate('linked_task_id', 'title active duration pillar frequency slot_preference')
      .lean();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(challenge, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/challenges/${params.id}]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/challenges/[id] ───────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID', code: 'INVALID_ID' }, { status: 400 });
    }

    const body = await request.json();
    const parseResult = challengeUpdateSchema.safeParse(body);

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

    await connectDB();

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { status, notes } = parseResult.data;

    if (status) {
      challenge.status = status;

      // If dropping: deactivate the linked task too
      if (status === 'dropped' && challenge.linked_task_id) {
        await Task.findByIdAndUpdate(challenge.linked_task_id, { $set: { active: false } });
      }
      // If pausing: task stays active — user can continue doing it manually
    }

    if (notes !== undefined) {
      challenge.notes = notes;
    }

    await challenge.save();

    return NextResponse.json(challenge.toObject(), { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/challenges/${params.id}]`, error);
    return NextResponse.json(
      { error: 'Failed to update challenge', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
