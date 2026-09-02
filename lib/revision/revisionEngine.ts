import RevisionQueue, { IRevisionQueue } from '@/models/RevisionQueue';
import Task, { ITask } from '@/models/Task';

// Default spaced-repetition cycle in days: review after 1, 3, 7, 14 days
export const DEFAULT_CYCLE = [1, 3, 7, 14];
// Maximum revision tasks inserted into a single day's plan
export const DAILY_REVISION_CAP = 3;

/**
 * Advances the revision cycle after a revision is completed.
 * BUG-12 fix: accepts an optional `completionDate` (YYYY-MM-DD) so that
 * next_revision is computed from the actual logged date, not server clock time.
 * Near-midnight submissions with a server in a different timezone would
 * previously produce the wrong next_revision date.
 */
export async function completeRevision(
  queueItem: IRevisionQueue,
  completionDate?: string
): Promise<void> {
  // Use the provided completion date as the base, not the server clock.
  // This prevents off-by-one errors near midnight for IST users.
  const baseDate = completionDate
    ? new Date(completionDate + 'T00:00:00Z') // UTC midnight of the completion day
    : new Date();                               // fallback: server clock

  queueItem.revision_history.push(baseDate);

  const nextIntervalIndex = queueItem.cycle_index;
  if (nextIntervalIndex < DEFAULT_CYCLE.length) {
    const intervalDays = DEFAULT_CYCLE[nextIntervalIndex];
    const nextDate = new Date(baseDate);
    // Use UTC date arithmetic to avoid DST/timezone shifts
    nextDate.setUTCDate(nextDate.getUTCDate() + intervalDays);
    queueItem.next_revision = nextDate;
    queueItem.cycle_index += 1;
  }

  await queueItem.save();
}

/**
 * Called when a task with `revision=true` is marked complete for the first time.
 * Creates or resets a RevisionQueue entry and seeds it at cycle_index 0.
 *
 * BUG-13 fix: was setting cycle_index = 1, which skipped the first interval
 * (DEFAULT_CYCLE[0] = 1 day). Now sets cycle_index = 0 and delegates to
 * completeRevision() to advance it to 1 with the correct next_revision date.
 */
export async function onTaskCompleted(task: ITask, completionDate?: string): Promise<void> {
  if (!task.revision) return;

  const dateStr = completionDate ?? new Date().toISOString().split('T')[0];
  const todayUTC = new Date(dateStr + 'T00:00:00Z');

  const existing = await RevisionQueue.findOne({ task_id: task._id });
  if (existing) {
    // Reset: wipe history and re-seed from cycle_index 0
    existing.learned_on = todayUTC;
    existing.cycle_index = 0;
    existing.revision_history = [todayUTC];
    existing.next_revision = todayUTC; // placeholder — completeRevision sets the real date
    await existing.save();
    await completeRevision(existing, dateStr); // advances cycle_index to 1, sets next_revision = today + cycle[0]
  } else {
    const newItem = await RevisionQueue.create({
      task_id: task._id,
      original_title: task.title,
      learned_on: todayUTC,
      next_revision: todayUTC, // placeholder — completeRevision sets the real date
      cycle_index: 0,
      revision_history: [todayUTC],
    });
    await completeRevision(newItem, dateStr); // advances to cycle_index 1, sets next_revision = today + 1 day
  }
}

/**
 * Returns all RevisionQueue items whose next_revision is on or before `date`.
 * BUG-21 fix: uses UTC end-of-day (`T23:59:59.999Z`) instead of local
 * `setHours(23,59,59)` which varies by server timezone.
 */
export async function getRevisionsDue(date: string): Promise<IRevisionQueue[]> {
  // UTC end of the target date — timezone-independent
  const endOfDayUTC = new Date(date + 'T23:59:59.999Z');

  return RevisionQueue.find({
    next_revision: { $lte: endOfDayUTC },
  }).populate('task_id');
}

/**
 * Builds lightweight ITask-like objects for today's due revisions.
 * Applies the daily cap (max DAILY_REVISION_CAP tasks);
 * extras have their next_revision deferred by 1 day.
 */
export async function buildRevisionTasksForDate(
  date: string
): Promise<{ revisionPseudoTasks: Partial<ITask>[]; queueItems: IRevisionQueue[] }> {
  const due = await getRevisionsDue(date);

  const capped = due.slice(0, DAILY_REVISION_CAP);
  const overflow = due.slice(DAILY_REVISION_CAP);

  // Defer overflow items by 1 day (UTC-safe)
  for (const item of overflow) {
    const deferred = new Date(item.next_revision);
    deferred.setUTCDate(deferred.getUTCDate() + 1);
    item.next_revision = deferred;
    await item.save();
  }

  const revisionPseudoTasks: Partial<ITask>[] = [];
  for (const item of capped) {
    // populate() may return a plain object or null in tests — fall back to original_title
    const parentTask = item.task_id as unknown as ITask | null;
    const pillar = parentTask?.pillar ?? 'soul';

    revisionPseudoTasks.push({
      _id: item._id as any,
      title: `Revise: ${item.original_title}`,
      pillar,
      type: 'recurring' as any,
      duration: 15,
      energy_cost: 'low',
      priority: 4,
      active: true,
    });
  }

  return { revisionPseudoTasks, queueItems: capped };
}
