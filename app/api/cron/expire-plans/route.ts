import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';
import { getTodayInTimezone } from '@/lib/utils/dateHelpers';

/**
 * POST /api/cron/expire-plans
 *
 * BUG-01 fix: Past-day `pending` entries never expired — they appeared as
 * carryovers indefinitely, even for tasks the user never actually saw.
 *
 * This endpoint bulk-updates all `pending` plan entries from before today to
 * `expired`, cutting them off from the carryover pool.
 *
 * Must be called once per day — ideally at midnight IST (18:30 UTC) via Vercel Cron.
 * Protected by CRON_SECRET header to prevent unauthorized access.
 *
 * Add to .env:
 *   CRON_SECRET=<random-secret>
 *
 * Vercel Cron schedule is defined in vercel.json.
 */
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await connectDB();

    // Use the user's canonical timezone (IST for single-user setup).
    // For multi-user, this would need to run per-user or after the last user's midnight.
    const tz = process.env.DEFAULT_TIMEZONE ?? 'Asia/Kolkata';
    const today = getTodayInTimezone(tz);

    // Expire all 'pending' entries in plans strictly before today.
    // Uses MongoDB's positional arrayFilter operator to update subdocuments in-place.
    const result = await DailyPlan.updateMany(
      {
        date: { $lt: today },
        'plan.status': 'pending', // short-circuit: only update docs that have pending entries
      },
      {
        $set: { 'plan.$[entry].status': 'expired' },
      },
      {
        arrayFilters: [{ 'entry.status': 'pending' }],
      }
    );

    return NextResponse.json({
      success: true,
      plansUpdated: result.modifiedCount,
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
