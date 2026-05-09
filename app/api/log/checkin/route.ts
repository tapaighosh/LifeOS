import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DayLog from '@/models/DayLog';
import DailyPlan from '@/models/DailyPlan';
import RevisionQueue from '@/models/RevisionQueue';
import Task from '@/models/Task';
import { dayLogCheckinSchema } from '@/lib/validators/dayLog';
import { buildNightInsight } from '@/lib/ai/insightBuilder';
import { onTaskCompleted, completeRevision } from '@/lib/revision/revisionEngine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parseResult = dayLogCheckinSchema.safeParse(body);

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

    const { date, entries, energy_rating, reflection } = parseResult.data;

    // 1. Save DayLog
    const dayLog = await DayLog.findOneAndUpdate(
      { date },
      { $set: { entries, energy_rating, reflection, ai_insight: null } },
      { new: true, upsert: true }
    );

    // 2. Sync statuses with DailyPlan
    const plan = await DailyPlan.findOne({ date });
    if (plan) {
      let changed = false;
      for (const pEntry of plan.plan) {
        const matchingLog = entries.find((e) => e.task_id === pEntry.task_id.toString());
        if (matchingLog) {
          pEntry.status = matchingLog.status as any;
          changed = true;
        }
      }
      if (changed) {
        // Also update skipped_tasks for any skipped entries? 
        // We'll leave DailyPlan's skipped_tasks as original plan overflows for simplicity, 
        // but log handles actual user skips.
        await plan.save();
      }
    }

    // 3. Update Revision Queue via revisionEngine
    for (const entry of entries) {
      if (entry.status !== 'done') continue;
      const task = await Task.findById(entry.task_id);
      if (!task) continue;

      // Check if this task_id maps to a RevisionQueue item (revision pseudo-task)
      const revQueueItem = await RevisionQueue.findById(entry.task_id);
      if (revQueueItem) {
        // It is a revision task — advance the cycle
        await completeRevision(revQueueItem);
      } else if (task.revision) {
        // First-time completion of a revisable task — seed the queue
        await onTaskCompleted(task);
      }
    }

    // 4. Generate tomorrow preview (top 3 tasks based on active)
    const topTasks = await Task.find({ active: true, type: { $ne: 'recharge' } })
      .sort({ priority: -1 })
      .limit(3)
      .lean();

    // 5. Flag neglected pillars (weekly balance)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const weekPlans = await DailyPlan.find({
      date: { $gte: sevenDaysAgoStr, $lte: date }
    }).lean();

    let moneyCount = 0, soulCount = 0, curiosityCount = 0;
    for (const wp of weekPlans) {
      for (const entry of wp.plan) {
        if (entry.status === 'done') {
          if (entry.pillar === 'money') moneyCount++;
          if (entry.pillar === 'soul') soulCount++;
          if (entry.pillar === 'curiosity') curiosityCount++;
        }
      }
    }
    const total = moneyCount + soulCount + curiosityCount;
    let neglectedPillars: string[] = [];
    if (total > 0) {
      if ((moneyCount / total) < 0.15) neglectedPillars.push('money');
      if ((soulCount / total) < 0.15) neglectedPillars.push('soul');
      if ((curiosityCount / total) < 0.15) neglectedPillars.push('curiosity');
    }

    // 6. Generate AI Night Insight
    const aiInsight = await buildNightInsight(dayLog.toObject());
    if (aiInsight) {
      dayLog.ai_insight = aiInsight;
      await dayLog.save();
    }

    return NextResponse.json({
      success: true,
      log: dayLog,
      tomorrowPreview: topTasks,
      neglectedPillars,
      aiPlaceholder: aiInsight || "Insight generation failed or skipped."
    }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/log/checkin]', error);
    return NextResponse.json(
      { error: 'Failed to save checkin', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
