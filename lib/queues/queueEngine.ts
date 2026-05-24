/**
 * Queue Engine — Core business logic for the Topic Queue System
 *
 * This module manages the lifecycle of topic items within queues:
 *
 * Key Invariant: At most ONE item per queue has status='in_progress' at any
 * time. This is enforced by advanceQueueItem(), which clears any existing
 * in_progress items before promoting the next pending item.
 *
 * Why synthetic entries instead of stub tasks?
 *   Queue topics are ephemeral learning suggestions, not persistent user
 *   commitments. Creating a Task document for each surfaced topic would
 *   pollute the master task list with items the user never explicitly created.
 *   Instead, queue topics appear in the DailyPlan as entry_type='queue_topic'
 *   entries that reference the TopicItem directly via topic_item_id.
 */

import TopicQueue, { ITopicQueue } from '@/models/TopicQueue';
import TopicItem, { ITopicItem } from '@/models/TopicItem';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueCandidate {
  queue_id: string;
  queue_name: string;
  pillar: 'money' | 'soul' | 'curiosity';
  queue_type: 'concept' | 'dsa';
  nextItem: ITopicItem | null;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Returns the next pending item in a queue (lowest order number).
 * Does NOT change any statuses — purely a read operation.
 */
export async function getNextPendingItem(queueId: string): Promise<ITopicItem | null> {
  return TopicItem.findOne({ queue_id: queueId, status: 'pending' }).sort({ order: 1 });
}

/**
 * Advances queue state after a user marks an item done or skipped.
 *
 * Order of operations (all in sequence, not parallel, to prevent race):
 *  1. Update the completed item's status + covered_on
 *  2. If covered with revision=true, schedule next_revision (+7 days)
 *  3. Clear any other in_progress items in the same queue (edge-case cleanup)
 *  4. Promote the next lowest-order pending item to in_progress
 *
 * The reason we reset ALL in_progress before promoting is to handle edge
 * cases where the user skips a day — the previous in_progress item would
 * still be in_progress. We treat that as stale and clear it before setting
 * the new one.
 */
export async function advanceQueueItem(
  itemId: string,
  status: 'covered' | 'skipped',
  date: string
): Promise<void> {
  // Step 1: Fetch the item to get queue_id and revision flag
  const item = await TopicItem.findById(itemId);
  if (!item) return;

  const queueId = item.queue_id;

  // Step 2: Update the item being completed
  const updatePayload: Record<string, unknown> = { status };
  if (status === 'covered') {
    updatePayload.covered_on = date;
    if (item.revision) {
      // +7 days for spaced repetition
      const nextRev = new Date(date);
      nextRev.setDate(nextRev.getDate() + 7);
      updatePayload.next_revision = nextRev.toISOString().split('T')[0];
    }
  }
  await TopicItem.updateOne({ _id: itemId }, { $set: updatePayload });

  // Step 3: Clear any stale in_progress items in this queue (except the one we just updated)
  await TopicItem.updateMany(
    { queue_id: queueId, status: 'in_progress', _id: { $ne: itemId } },
    { $set: { status: 'pending' } }
  );

  // Step 4: Promote next pending item to in_progress
  const nextItem = await TopicItem.findOne({
    queue_id: queueId,
    status: 'pending',
    _id: { $ne: itemId },
  }).sort({ order: 1 });

  if (nextItem) {
    await TopicItem.updateOne({ _id: nextItem._id }, { $set: { status: 'in_progress' } });
  }
}

/**
 * Builds the queue context for plan generation.
 *
 * For each active queue, finds the "next" item to surface:
 *   - If an item is already in_progress, that takes priority (user was mid-study)
 *   - Otherwise, find the next pending item (lowest order)
 *
 * Returns only queues that have at least one remaining item.
 * Queues where all items are covered/skipped are excluded (nothing to surface).
 */
export async function buildQueueContextForPlan(): Promise<QueueCandidate[]> {
  const queues = await TopicQueue.find({ active: true }).lean();
  const candidates: QueueCandidate[] = [];

  for (const queue of queues) {
    const queueIdStr = queue._id.toString();

    // First check for an already in-progress item (resume from yesterday)
    let nextItem = await TopicItem.findOne({
      queue_id: queue._id,
      status: 'in_progress',
    }).sort({ order: 1 });

    // Fall back to next pending
    if (!nextItem) {
      nextItem = await TopicItem.findOne({
        queue_id: queue._id,
        status: 'pending',
      }).sort({ order: 1 });
    }

    if (!nextItem) continue; // queue is fully covered/skipped

    candidates.push({
      queue_id: queueIdStr,
      queue_name: queue.name,
      pillar: queue.pillar,
      queue_type: queue.queue_type,
      nextItem,
    });
  }

  return candidates;
}

/**
 * Returns all topic items that are due for revision today or earlier.
 * Used by the weekly aggregator and plan generator to surface revision reminders.
 */
export async function getRevisionsDue(date: string): Promise<ITopicItem[]> {
  return TopicItem.find({
    next_revision: { $lte: date },
    status: 'covered',
    revision: true,
  });
}
