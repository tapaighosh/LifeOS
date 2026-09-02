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
  params: Promise<{ id: string }>;
}

// ─── GET /api/challenges/[id] ─────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  let id = 'unknown';
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    id = (await params).id;
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
    console.error('[GET /api/challenges/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/challenges/[id] ───────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let id = 'unknown';
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    id = (await params).id;
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

      // GAP-05: Linked task status toggle
      // If dropping or pausing: deactivate the linked task so scheduler stops surfacing it
      // If resuming (active): reactivate the linked task
      if ((status === 'dropped' || status === 'paused') && challenge.linked_task_id) {
        await Task.findByIdAndUpdate(challenge.linked_task_id, { $set: { active: false } });
      } else if (status === 'active' && challenge.linked_task_id) {
        await Task.findByIdAndUpdate(challenge.linked_task_id, { $set: { active: true } });
      }
    }

    if (notes !== undefined) {
      challenge.notes = notes;
    }

    await challenge.save();

    return NextResponse.json(challenge.toObject(), { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/challenges/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update challenge', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
