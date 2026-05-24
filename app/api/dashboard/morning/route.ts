/**
 * GET /api/dashboard/morning
 *
 * Single aggregation call for the Morning Dashboard view.
 * Returns: today's plan, top 3 active challenges, 7-day pillar health, energy forecast.
 *
 * WHY SWR + client fetch instead of server fetch:
 *   Next.js server components run in UTC. A user in IST (UTC+5:30) at 11:30 PM
 *   would see the "morning" view if the server used new Date().getHours() — because
 *   the server clock says 18:00 UTC. The only reliable way to read local time is
 *   in the browser. So the dashboard page is a client component that checks
 *   new Date().getHours() locally and then fetches data via SWR.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import Challenge from '@/models/Challenge';
import UserSettings from '@/models/UserSettings';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in server local

    // ── 1. Today's plan ────────────────────────────────────────────────────────
    const plan = await DailyPlan.findOne({ date: today }).lean();

    // ── 2. Active challenges — top 3 sorted by type priority ──────────────────
    const allActive = await Challenge.find({ status: 'active' })
      .select('title category target_type target_value current_streak total_completed best_streak last_completed_on')
      .lean();

    // Sort: streak first, then total_count, then milestone
    const typeOrder = { streak: 0, total_count: 1, milestone: 2 };
    allActive.sort((a, b) => typeOrder[a.target_type] - typeOrder[b.target_type]);
    const activeChallenges = allActive.slice(0, 3);

    // ── 3. Pillar health — last 7 days ────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const weekPlans = await DailyPlan.find({
      date: { $gte: sevenDaysAgoStr, $lte: today },
    }).lean();

    let moneyCount = 0, soulCount = 0, curiosityCount = 0;
    for (const wp of weekPlans) {
      for (const entry of wp.plan) {
        if (entry.status === 'done' && entry.entry_type !== 'recharge') {
          if (entry.pillar === 'money') moneyCount++;
          if (entry.pillar === 'soul') soulCount++;
          if (entry.pillar === 'curiosity') curiosityCount++;
        }
      }
    }

    // Load user targets
    const settings = await UserSettings.findOne().lean();
    const targets = settings?.pillar_balance_target ?? { money: 40, soul: 30, curiosity: 30 };

    const pillarWeek = {
      money:     { count: moneyCount,     target: targets.money },
      soul:      { count: soulCount,      target: targets.soul },
      curiosity: { count: curiosityCount, target: targets.curiosity },
    };

    // ── 4. Energy forecast — average of last 3 DayLogs ────────────────────────
    const recentLogs = await DayLog.find({})
      .sort({ date: -1 })
      .limit(3)
      .select('energy_rating')
      .lean();

    let energyForecast: 'low' | 'moderate' | 'high' | null = null;
    if (recentLogs.length > 0) {
      const avg = recentLogs.reduce((s, l) => s + l.energy_rating, 0) / recentLogs.length;
      if (avg <= 2) energyForecast = 'low';
      else if (avg <= 3.5) energyForecast = 'moderate';
      else energyForecast = 'high';
    }

    // Determine which pillar has most done tasks (for suggestion)
    const pillarCounts = { money: moneyCount, soul: soulCount, curiosity: curiosityCount };
    const suggestedPillar = (Object.keys(pillarCounts) as (keyof typeof pillarCounts)[])
      .reduce((a, b) => pillarCounts[a] < pillarCounts[b] ? a : b);

    return NextResponse.json({
      plan,
      activeChallenges,
      pillarWeek,
      energyForecast,
      suggestedPillar,
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/dashboard/morning]', error);
    return NextResponse.json(
      { error: 'Failed to fetch morning data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
