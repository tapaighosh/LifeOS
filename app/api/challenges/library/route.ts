/**
 * GET /api/challenges/library
 *
 * Returns the static CHALLENGE_LIBRARY, optionally filtered by ?category=.
 * Also cross-references the DB to mark which challenges the user has already accepted.
 *
 * Query params:
 *   ?category=physical|mental|financial|social|creative  (optional)
 *
 * Example response:
 * [{ ...libraryItem, already_accepted: true|false }]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Challenge from '@/models/Challenge';
import { CHALLENGE_LIBRARY } from '@/lib/challenges/library';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');

    // Filter library in memory (no DB needed)
    let items = CHALLENGE_LIBRARY;
    if (categoryFilter) {
      const validCategories = ['physical', 'mental', 'financial', 'social', 'creative'];
      if (!validCategories.includes(categoryFilter)) {
        return NextResponse.json(
          { error: 'Invalid category filter', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      items = CHALLENGE_LIBRARY.filter((c) => c.category === categoryFilter);
    }

    // Cross-reference DB to find which library IDs are already active for this user
    await connectDB();
    const activeChallenges = await Challenge.find({
      status: { $in: ['active', 'paused'] },
    })
      .select('title status')
      .lean();

    // We match by title since library_id is not stored in the DB model
    // (the library is stateless — only title is the durable link)
    const acceptedTitles = new Set(activeChallenges.map((c) => c.title));

    const enriched = items.map((item) => ({
      ...item,
      already_accepted: acceptedTitles.has(item.title),
    }));

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error('[GET /api/challenges/library]', error);
    return NextResponse.json(
      { error: 'Failed to fetch library', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
