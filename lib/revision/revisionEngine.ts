import RevisionQueue, { IRevisionQueue } from '@/models/RevisionQueue';
import Task, { ITask } from '@/models/Task';

// Default spaced-repetition cycle in days: review after 1, 3, 7, 14 days
export const DEFAULT_CYCLE = [1, 3, 7, 14];
// Maximum revision tasks inserted into a single day's plan
export const DAILY_REVISION_CAP = 3;

/**
 * Called when a task with `revision=true` is marked complete.
 * Creates or resets a RevisionQueue entry using the default cycle.
 */
export async function onTaskCompleted(task: ITask): Promise<void> {
  if (!task.revision) return;

  // Use UTC midnight to avoid timezone shift causing off-by-one day errors
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const nextRevDate = new Date(todayUTC);
  nextRevDate.setUTCDate(nextRevDate.getUTCDate() + DEFAULT_CYCLE[0]);

  const existing = await RevisionQueue.findOne({ task_id: task._id });
  if (existing) {
    existing.learned_on = todayUTC;
    existing.next_revision = nextRevDate;
    existing.cycle_index = 1;
    existing.revision_history.push(todayUTC);
    await existing.save();
  } else {
    await RevisionQueue.create({
      task_id: task._id,
      original_title: task.title,
      learned_on: todayUTC,
      next_revision: nextRevDate,
      cycle_index: 1,
      revision_history: [todayUTC],
    });
  }
}

/**
 * Returns all RevisionQueue items whose next_revision is on or before `date`.
 * Missed revisions stay in the queue — they are never auto-deleted.
 */
export async function getRevisionsDue(date: string): Promise<IRevisionQueue[]> {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return RevisionQueue.find({
    next_revision: { $lte: endOfDay },
  }).populate('task_id');
}

/**
 * Advances the cycle after a revision is completed.
 * If the cycle is exhausted, the item stays with its last next_revision date
 * (effectively considered "mastered" – still visible but not re-queued).
 */
export async function completeRevision(queueItem: IRevisionQueue): Promise<void> {
  const now = new Date();
  queueItem.revision_history.push(now);

  const nextIntervalIndex = queueItem.cycle_index;
  if (nextIntervalIndex < DEFAULT_CYCLE.length) {
    const intervalDays = DEFAULT_CYCLE[nextIntervalIndex];
    const nextDate = new Date();
    // Use UTC to avoid timezone shifts
    nextDate.setUTCDate(nextDate.getUTCDate() + intervalDays);
    queueItem.next_revision = nextDate;
    queueItem.cycle_index += 1;
  }

  await queueItem.save();
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
