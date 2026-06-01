import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getRevisionsDue, DAILY_REVISION_CAP } from '@/lib/revision/revisionEngine';

/**
 * GET /api/revision/queue
 *
 * Returns all RevisionQueue items whose next_revision is on or before today.
 * Capped at DAILY_REVISION_CAP (3) — extras are already deferred by the
 * plan generation step, but we apply the same cap here for safety.
 *
 * Example response:
 *   { items: [{ _id, original_title, learned_on, next_revision, cycle_index }] }
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const today = new Date().toISOString().split('T')[0];
    const due = await getRevisionsDue(today);

    // Surface only the capped set — same window the planner would see
    const items = due.slice(0, DAILY_REVISION_CAP).map((item) => ({
      _id: String(item._id),
      original_title: item.original_title,
      learned_on: item.learned_on,
      next_revision: item.next_revision,
      cycle_index: item.cycle_index,
      // cycle_index=1 means just started, 4 = mastered after last interval
      progress: `${item.cycle_index}/${4}`,
    }));

    return NextResponse.json({ items, total: due.length }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/revision/queue]', error);
    return NextResponse.json(
      { error: 'Failed to fetch revision queue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
