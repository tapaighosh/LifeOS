import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DayLog from '@/models/DayLog';
import DailyPlan from '@/models/DailyPlan';
import RevisionQueue from '@/models/RevisionQueue';
import Task from '@/models/Task';
import Challenge from '@/models/Challenge';
import UserSettings from '@/models/UserSettings';
import { dayLogCheckinSchema } from '@/lib/validators/dayLog';
import { buildNightInsight } from '@/lib/ai/insightBuilder';
import { onTaskCompleted, completeRevision } from '@/lib/revision/revisionEngine';
import { advanceQueueItem } from '@/lib/queues/queueEngine';
import { getOffsetDateInTimezone } from '@/lib/utils/dateHelpers';

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

    // ── Fetch user settings (needed for timezone + pillar targets) ──────────
    const settings = await UserSettings.findOne().lean();
    const tz = settings?.timezone ?? 'Asia/Kolkata';

    // ── Idempotency guard: reject duplicate submissions ─────────────────────
    // Once is_submitted is true, all side effects have already fired.
    // A second submission would double-count challenges, revision seeds, and queue advances.
    const existingLog = await DayLog.findOne({ date });
    if (existingLog?.is_submitted) {
      return NextResponse.json(
        { error: 'Check-in already submitted for this date.', code: 'ALREADY_SUBMITTED' },
        { status: 409 }
      );
    }

    // 1. Save DayLog (mark as submitted atomically with the data write)
    // BUG-23 fix: do NOT set ai_insight: null upfront — if AI fails later it would
    // permanently stay null, discarding any previously generated insight.
    // ai_insight is only written after a successful AI call (step 6 below).
    const dayLog = await DayLog.findOneAndUpdate(
      { date },
      { $set: { entries, energy_rating, reflection, is_submitted: true, submitted_at: new Date() } },
      { new: true, upsert: true }
    );

    // 2. Sync statuses with DailyPlan
    const plan = await DailyPlan.findOne({ date });
    if (plan) {
      let changed = false;
      for (const pEntry of plan.plan) {
        if (pEntry.entry_type === 'queue_topic') continue;
        const matchingLog = entries.find((e) => e.task_id && pEntry.task_id && e.task_id === pEntry.task_id.toString());
        if (matchingLog) {
          pEntry.status = matchingLog.status as any;
          changed = true;
        }
      }

      // Check if all entries in the plan are resolved
      const allResolved = plan.plan.every((e) =>
        ['done', 'partial', 'skipped', 'expired', 'displaced'].includes(e.status)
      );
      if (allResolved && plan.plan_status !== 'completed') {
        plan.plan_status = 'completed';
        changed = true;
      }

      if (changed) {
        await plan.save();
      }
    }

    // 3. Update Revision Queue via revisionEngine
    for (const entry of entries) {
      if (entry.status !== 'done') continue;
      if (entry.entry_type === 'queue_topic') continue;
      
      const task = await Task.findById(entry.task_id);
      if (!task) continue;

      // Deactivate one-time tasks upon completion
      if (task.type === 'one-time') {
        task.active = false;
        await task.save();
      }

      // Bug fix: use findOne({ task_id }) not findById(task_id)
      // RevisionQueue items have their own _id; task_id is a foreign key field
      const revQueueItem = await RevisionQueue.findOne({ task_id: entry.task_id });
      if (revQueueItem) {
        // It is a revision task — advance the cycle
        await completeRevision(revQueueItem, date); // BUG-12: pass checkin date, not server clock
      } else if (task.revision) {
        // First-time completion of a revisable task — seed the queue
        await onTaskCompleted(task, date); // BUG-12: pass checkin date
      }
    }

    // 4. Generate tomorrow preview — BUG-22 fix: filter by task frequency
    // Previously fetched top 3 by priority ignoring frequency;
    // weekly tasks would surface on wrong days (e.g. a Monday-only task shown on Sunday preview).
    const tomorrowDateObj = new Date(date + 'T00:00:00Z');
    tomorrowDateObj.setUTCDate(tomorrowDateObj.getUTCDate() + 1);
    const tomorrowDOW = tomorrowDateObj.getUTCDay();

    function isTaskDueTomorrow(task: any): boolean {
      if (!task.frequency) return task.type !== 'recurring';
      switch (task.frequency) {
        case 'daily':    return true;
        case 'alternate': {
          const daysSinceCreation = Math.floor(
            (tomorrowDateObj.getTime() - new Date(task.createdAt).getTime()) / 86400000
          );
          return daysSinceCreation % 2 === 0;
        }
        case '3x_week': return [1, 3, 5].includes(tomorrowDOW); // Mon/Wed/Fri
        case 'weekly':  return tomorrowDOW === 1;                // Monday only
        default:        return true;                             // 'custom' — include by default
      }
    }

    const allActiveTasks = await Task.find({ active: true, type: { $ne: 'recharge' } })
      .sort({ priority: -1 })
      .lean();
    const topTasks = allActiveTasks.filter(isTaskDueTomorrow).slice(0, 3);

    // 5. Flag neglected pillars (weekly balance)
    // Uses the user's actual pillar_balance_target, not a hardcoded 15% threshold.
    const sevenDaysAgoStr = getOffsetDateInTimezone(tz, -7);

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
      // A pillar is neglected when its actual share is below 60% of its target share.
      // Example: target=40%, threshold=24%. Old hardcoded 15% would miss edge cases.
      const targets = (settings as any)?.pillar_balance_target ?? { money: 40, soul: 30, curiosity: 30 };
      const NEGLECT_FACTOR = 0.6;
      const moneyPct  = (moneyCount / total) * 100;
      const soulPct   = (soulCount / total) * 100;
      const curiosityPct = (curiosityCount / total) * 100;
      if (moneyPct  < targets.money  * NEGLECT_FACTOR) neglectedPillars.push('money');
      if (soulPct   < targets.soul   * NEGLECT_FACTOR) neglectedPillars.push('soul');
      if (curiosityPct < targets.curiosity * NEGLECT_FACTOR) neglectedPillars.push('curiosity');
    }

    // 6. Generate AI Night Insight
    const aiInsight = await buildNightInsight(dayLog.toObject());
    if (aiInsight) {
      dayLog.ai_insight = aiInsight;
      await dayLog.save();
    }

    // 7. Challenge progress hook
    // Runs after DayLog is committed. This is intentionally a post-save side effect
    // (not Mongoose middleware) so it can be tested independently.
    for (const entry of entries) {
      try {
        if (entry.entry_type === 'queue_topic') continue;

        const challenge = await Challenge.findOne({
          linked_task_id: entry.task_id,
          status: 'active',
        });
        if (!challenge) continue;

        if (entry.status === 'done') {
          // ── Same-day guard: prevent double-counting if submitted twice ──────
          // The is_submitted guard above blocks this at route level, but this is
          // a defensive second layer (e.g. direct API calls bypassing the route).
          if (challenge.last_completed_on === date) {
            continue; // already counted today — skip
          }

          const prevLastCompleted = challenge.last_completed_on;
          challenge.total_completed += 1;
          challenge.last_completed_on = date;

          if (challenge.target_type === 'streak') {
            if (prevLastCompleted) {
              // Calculate calendar day gap between last completion and today
              const prev = new Date(prevLastCompleted);
              const today = new Date(date);
              const msPerDay = 24 * 60 * 60 * 1000;
              const gap = Math.round((today.getTime() - prev.getTime()) / msPerDay);

              if (gap === 1) {
                challenge.current_streak += 1;
              } else {
                // Gap > 1 means a day was missed — streak resets to 1 (today counts)
                challenge.current_streak = 1;
              }
            } else {
              // First ever completion
              challenge.current_streak = 1;
            }

            if (challenge.current_streak > challenge.best_streak) {
              challenge.best_streak = challenge.current_streak;
            }
          }

          // Check for challenge completion
          if (challenge.total_completed >= challenge.target_value) {
            challenge.status = 'completed';
          }

          await challenge.save();
        } else if (
          (entry.status === 'skipped' || entry.status === 'partial') &&
          challenge.target_type === 'streak'
        ) {
          // Both skipped and partial reset the streak (partial ≠ done for streak challenges)
          challenge.current_streak = 0;
          await challenge.save();
        }
      } catch (challengeErr) {
        // Challenge hook errors must never break the check-in submission
        console.error('[checkin] challenge hook error:', challengeErr);
      }
    }

    // 8. Queue topic completion hook
    // Runs after DayLog is committed. For each queue_topic entry in today's check-in:
    //   - 'done' → mark covered via advanceQueueItem
    //   - anything else → increment skip_count and requeue at end (status stays pending)
    const queueEntries = (entries as any[]).filter(
      (e) => e.entry_type === 'queue_topic'
    );
    for (const entry of queueEntries) {
      try {
        if (!entry.topic_item_id) continue;
        if (entry.status === 'done') {
          await advanceQueueItem(entry.topic_item_id.toString(), 'covered', date);
        } else {
          // Skip: increment skip_count, stay pending, requeue at end
          const TopicItem = (await import('@/models/TopicItem')).default;
          const skippedItem = await TopicItem.findById(entry.topic_item_id.toString());
          if (skippedItem) {
            const maxOrderItem = await TopicItem.findOne({
              queue_id: skippedItem.queue_id,
              status: 'pending',
            })
              .sort({ order: -1 })
              .lean();
            const newOrder = (maxOrderItem?.order ?? 0) + 1;
            await TopicItem.findByIdAndUpdate(entry.topic_item_id.toString(), {
              $inc: { skip_count: 1 },
              $set: { last_skipped_on: date, order: newOrder, status: 'pending' },
            });
          }
        }
      } catch (queueErr) {
        // Queue hook errors must never break the check-in submission
        console.error('[checkin] queue hook error:', queueErr);
      }
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
