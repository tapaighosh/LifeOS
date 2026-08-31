import Task from '@/models/Task';
import TopicItem from '@/models/TopicItem';
import mongoose from 'mongoose';
import { AIPlanResponse } from './responseParser';

export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Post-Zod business validation for AI-generated plans.
 *
 * Zod validates shape only. This validator performs semantic checks that Zod cannot:
 *  1. All task_id values must exist in the tasks collection (guards against AI hallucination).
 *  2. All topic_item_id values must exist in the topic_items collection.
 *  3. No two entries may have overlapping time windows.
 *
 * If validation fails, the caller should fall back to the rule-based scheduler.
 */
export async function validateAIPlan(
  aiPlan: AIPlanResponse
): Promise<PlanValidationResult> {
  const errors: string[] = [];
  const taskIds: string[] = [];
  const topicItemIds: string[] = [];

  for (const entry of aiPlan.plan) {
    if (entry.entry_type === 'task') {
      taskIds.push(entry.task_id);
    } else if (entry.entry_type === 'queue_topic') {
      topicItemIds.push(entry.topic_item_id);
    }
  }

  // ── 1. Verify task_ids exist in DB ─────────────────────────────────────
  if (taskIds.length > 0) {
    const validObjectIds = taskIds.filter((id) => mongoose.isValidObjectId(id));
    const invalidFormat = taskIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalidFormat.length > 0) {
      errors.push(`Invalid ObjectId format in task_ids: ${invalidFormat.join(', ')}`);
    }
    if (validObjectIds.length > 0) {
      const found = await Task.find({ _id: { $in: validObjectIds } }).select('_id').lean();
      const foundSet = new Set(found.map((t) => (t._id as mongoose.Types.ObjectId).toString()));
      const missing = validObjectIds.filter((id) => !foundSet.has(id));
      if (missing.length > 0) {
        errors.push(`task_ids not found in DB (AI hallucinated): ${missing.join(', ')}`);
      }
    }
  }

  // ── 2. Verify topic_item_ids exist in DB ───────────────────────────────
  if (topicItemIds.length > 0) {
    const validObjectIds = topicItemIds.filter((id) => mongoose.isValidObjectId(id));
    const invalidFormat = topicItemIds.filter((id) => !mongoose.isValidObjectId(id));
    if (invalidFormat.length > 0) {
      errors.push(`Invalid ObjectId format in topic_item_ids: ${invalidFormat.join(', ')}`);
    }
    if (validObjectIds.length > 0) {
      const found = await TopicItem.find({ _id: { $in: validObjectIds } }).select('_id').lean();
      const foundSet = new Set(found.map((t) => (t._id as mongoose.Types.ObjectId).toString()));
      const missing = validObjectIds.filter((id) => !foundSet.has(id));
      if (missing.length > 0) {
        errors.push(`topic_item_ids not found in DB (AI hallucinated): ${missing.join(', ')}`);
      }
    }
  }

  // ── 3. Check for time overlaps ─────────────────────────────────────────
  const sorted = [...aiPlan.plan].sort((a, b) =>
    a.time_start.localeCompare(b.time_start)
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr.time_end > next.time_start) {
      errors.push(
        `Time overlap: "${curr.title}" (${curr.time_start}–${curr.time_end}) overlaps "${next.title}" (${next.time_start}–${next.time_end})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
