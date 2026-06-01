import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Principle from '@/models/Principle';

/**
 * GET /api/principles/today
 *
 * Returns one active principle for display today.
 *
 * Selection strategy (null sorts before any date string in MongoDB):
 *   1. Prefer principles whose `last_shown` is NOT today, sorted oldest-first.
 *   2. If all active principles were already shown today, fall back to the
 *      one with the oldest `last_shown` (least recently shown overall).
 *   3. If no active principles exist at all, returns `{ principle: null }`.
 *
 * Idempotent update: `last_shown` is only written when it differs from today,
 * so repeated calls within the same day are safe and cheap.
 *
 * Example response (200):
 *   { "principle": { "_id": "…", "heading": "Do what you love", "body": "…" } }
 *
 * Example response — nothing seeded (200):
 *   { "principle": null }
 */
export async function GET(_request: NextRequest) {
  try {
    // --- Auth ---------------------------------------------------------------
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    // --- Determine today's date string (YYYY-MM-DD, UTC) --------------------
    const today = new Date().toISOString().split('T')[0];

    // --- Step 1: find a principle not yet shown today -----------------------
    // MongoDB sorts null < any string, so unseen principles surface first.
    let principle = await Principle.findOne({
      active: true,
      last_shown: { $ne: today },
    })
      .sort({ last_shown: 1 })
      .select('_id heading body last_shown')
      .lean();

    // --- Step 2: all shown today — fall back to least-recently-shown --------
    if (!principle) {
      principle = await Principle.findOne({ active: true })
        .sort({ last_shown: 1 })
        .select('_id heading body last_shown')
        .lean();
    }

    // --- Step 3: collection is empty ----------------------------------------
    if (!principle) {
      return NextResponse.json({ principle: null }, { status: 200 });
    }

    // --- Idempotent last_shown update ----------------------------------------
    // Only write if this principle hasn't been stamped today yet.
    if (principle.last_shown !== today) {
      await Principle.updateOne(
        { _id: principle._id },
        { $set: { last_shown: today } }
      );
    }

    // --- Return only the UI-facing fields ------------------------------------
    return NextResponse.json(
      {
        principle: {
          _id: principle._id,
          heading: principle.heading,
          body: principle.body,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/principles/today]', error);
    return NextResponse.json(
      { error: 'Failed to fetch principle', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
