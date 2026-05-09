/**
 * POST /api/challenges/accept
 *
 * Accepts a challenge from the library:
 *   1. Validates payload (library_id, pillar, optional frequency)
 *   2. Finds the library item
 *   3. Creates a recurring Task linked to this challenge
 *   4. Creates the Challenge document
 *   5. Updates task.challenge_id to point back to the challenge
 *
 * This two-step (task → challenge → update task) is necessary because
 * each document needs the other's _id as a reference.
 *
 * Example response:
 * { challenge: { ... }, task: { ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';
import Challenge from '@/models/Challenge';
import { challengeAcceptSchema } from '@/lib/validators/challenge';
import { CHALLENGE_LIBRARY } from '@/lib/challenges/library';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = challengeAcceptSchema.safeParse(body);

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

    const { library_id, pillar, frequency } = parseResult.data;

    // Find the library item
    const libraryItem = CHALLENGE_LIBRARY.find((c) => c.id === library_id);
    if (!libraryItem) {
      return NextResponse.json(
        { error: 'Library item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await connectDB();

    // Prevent duplicate active challenges for the same library item
    const existing = await Challenge.findOne({
      title: libraryItem.title,
      status: { $in: ['active', 'paused'] },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have this challenge active', code: 'DUPLICATE' },
        { status: 409 }
      );
    }

    // Step 1 — Create the recurring Task
    const task = await Task.create({
      title: libraryItem.title,
      pillar,
      type: 'recurring',
      duration: libraryItem.suggested_duration,
      energy_cost: 'medium',
      slot_preference: 'any',
      frequency: frequency || libraryItem.suggested_frequency,
      active: true,
      challenge_id: null, // will be back-filled after challenge is created
    });

    // Step 2 — Create the Challenge document
    const today = new Date().toISOString().split('T')[0];
    const challenge = await Challenge.create({
      title: libraryItem.title,
      category: libraryItem.category,
      description: libraryItem.description,
      target_type: libraryItem.target_type,
      target_value: libraryItem.target_value,
      started_on: today,
      status: 'active',
      linked_task_id: task._id,
      current_streak: 0,
      best_streak: 0,
      total_completed: 0,
    });

    // Step 3 — Back-fill task.challenge_id
    await Task.findByIdAndUpdate(task._id, { $set: { challenge_id: challenge._id } });

    return NextResponse.json(
      { challenge: challenge.toObject(), task: task.toObject() },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/challenges/accept]', error);
    return NextResponse.json(
      { error: 'Failed to accept challenge', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
