/**
 * GET /api/challenges
 *
 * Returns all user challenges with status 'active' or 'completed',
 * sorted by started_on DESC. Populates linked_task_id with title + active fields.
 *
 * Example response:
 * [{ _id, title, category, status, target_type, target_value, current_streak,
 *    total_completed, last_completed_on, linked_task_id: { title, active }, ... }]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Challenge from '@/models/Challenge';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const challenges = await Challenge.find({
      status: { $in: ['active', 'completed'] },
    })
      .sort({ started_on: -1 })
      .populate('linked_task_id', 'title active')
      .lean();

    return NextResponse.json(challenges, { status: 200 });
  } catch (error) {
    console.error('[GET /api/challenges]', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
