import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';
import TopicItem from '@/models/TopicItem';
import { getTodayInTimezone } from '@/lib/utils/dateHelpers';

/**
 * POST /api/cron/expire-plans
 *
 * Midnight Cron job executed daily (e.g. 18:30 UTC = 00:00 IST via Vercel Cron).
 * Performs the following automated state transitions:
 *   1. Expires unresolved entries ('planned', 'pending', 'in_progress' → 'expired') for past plans.
 *   2. Force-closes past unclosed plans ('draft', 'active' → 'closed').
 *   3. Reverts orphaned in_progress TopicItem records back to 'pending' (GAP-06).
 *
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await connectDB();

    const tz = process.env.DEFAULT_TIMEZONE ?? 'Asia/Kolkata';
    const today = getTodayInTimezone(tz);

    // 1. Expire all unresolved entries ('planned', 'pending', 'in_progress') in past plans
    const entryResult = await DailyPlan.updateMany(
      {
        date: { $lt: today },
        'plan.status': { $in: ['planned', 'pending', 'in_progress'] },
      },
      {
        $set: { 'plan.$[entry].status': 'expired' },
      },
      {
        arrayFilters: [{ 'entry.status': { $in: ['planned', 'pending', 'in_progress'] } }],
      }
    );

    // 2. Force close past plans that were left as 'draft' or 'active'
    const planCloseResult = await DailyPlan.updateMany(
      {
        date: { $lt: today },
        plan_status: { $in: ['draft', 'active'] },
      },
      {
        $set: { plan_status: 'closed' },
      }
    );

    // 3. Revert orphaned TopicItems ('in_progress' without a completed check-in) back to 'pending' (GAP-06)
    // GUARD: Only revert items that are NOT referenced in today's plan.
    // Items in today's active plan should stay 'in_progress' until checkin resolves them.
    const todayPlan = await DailyPlan.findOne({ date: today }).lean();
    const todayTopicIds = new Set<string>();
    if (todayPlan) {
      for (const entry of todayPlan.plan) {
        if (entry.entry_type === 'queue_topic' && entry.task_id) {
          todayTopicIds.add(entry.task_id.toString());
        }
      }
    }
    const topicRevertFilter: Record<string, any> = { status: 'in_progress' };
    if (todayTopicIds.size > 0) {
      topicRevertFilter._id = { $nin: Array.from(todayTopicIds) };
    }
    const topicRevertResult = await TopicItem.updateMany(
      topicRevertFilter,
      { $set: { status: 'pending' } }
    );

    return NextResponse.json({
      success: true,
      entriesExpiredCount: entryResult.modifiedCount,
      plansClosedCount: planCloseResult.modifiedCount,
      topicsRevertedCount: topicRevertResult.modifiedCount,
      expiredBefore: today,
      timezone: tz,
    });
  } catch (error) {
    console.error('[POST /api/cron/expire-plans]', error);
    return NextResponse.json(
      { error: 'Failed to expire past plans', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
