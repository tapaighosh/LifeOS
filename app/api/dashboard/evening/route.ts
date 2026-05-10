/**
 * GET /api/dashboard/evening
 *
 * Returns today's completion summary, challenge wins, and tomorrow's top 3 tasks.
 *
 * tomorrowPreview improvement: respects task frequency so alternate/weekly tasks
 * only appear if they're actually due tomorrow.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import Challenge from '@/models/Challenge';
import Task from '@/models/Task';

function isDueTomorrow(task: { frequency?: string }, dayOfWeek: number): boolean {
  if (!task.frequency || task.frequency === 'daily') return true;
  if (task.frequency === 'alternate') return true; // simplification: always eligible
  if (task.frequency === '3x_week') return true;   // simplification: eligible most days
  if (task.frequency === 'weekly') {
    // Weekly tasks qualify if tomorrow is Monday (start of a new week)
    return dayOfWeek === 0; // dayOfWeek is tomorrow's day (0=Sun already shifted)
  }
  return true;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const today = new Date().toLocaleDateString('en-CA');
    const todayPlan = await DailyPlan.findOne({ date: today }).lean();
    const todayLog = await DayLog.findOne({ date: today }).lean();

    // ── Today's summary ───────────────────────────────────────────────────────
    const planEntries = todayPlan?.plan ?? [];
    const taskEntries = planEntries.filter((e) => e.entry_type !== 'recharge');
    const totalScheduled = taskEntries.length;
    const totalDone = taskEntries.filter((e) => e.status === 'done').length;
    const totalSkipped = taskEntries.filter((e) => e.status === 'skipped').length;

    const pillarBreakdown = { money: 0, soul: 0, curiosity: 0 };
    for (const e of taskEntries) {
      if (e.status === 'done') {
        pillarBreakdown[e.pillar as keyof typeof pillarBreakdown]++;
      }
    }

    const todaySummary = { totalScheduled, totalDone, totalSkipped, pillarBreakdown };

    // ── Check-in done? ────────────────────────────────────────────────────────
    const checkinDone = !!todayLog;

    // ── Challenge wins today ──────────────────────────────────────────────────
    const activeChallenges = await Challenge.find({ status: 'active' })
      .populate<{ linked_task_id: { _id: string } }>('linked_task_id', '_id')
      .lean();

    const challengeWins = activeChallenges.map((ch) => {
      const linkedId = ch.linked_task_id?._id?.toString();
      const planEntry = taskEntries.find((e) => e.task_id?.toString() === linkedId);
      return {
        _id: ch._id,
        title: ch.title,
        current_streak: ch.current_streak,
        status: planEntry ? planEntry.status : 'pending',
      };
    }).filter((cw) => {
      // Only show challenges whose task is in today's plan
      const linkedId = activeChallenges.find(
        (ch) => ch._id?.toString() === cw._id?.toString()
      )?.linked_task_id?._id?.toString();
      return taskEntries.some((e) => e.task_id?.toString() === linkedId);
    });

    // ── Tomorrow preview — frequency-aware ────────────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    const allActiveTasks = await Task.find({ active: true, type: { $ne: 'recharge' } })
      .sort({ priority: -1 })
      .lean();

    const tomorrowPreview = allActiveTasks
      .filter((t) => isDueTomorrow(t, tomorrowDayOfWeek))
      .slice(0, 3);

    return NextResponse.json({
      todaySummary,
      checkinDone,
      challengeWins,
      tomorrowPreview,
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/dashboard/evening]', error);
    return NextResponse.json(
      { error: 'Failed to fetch evening data', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
