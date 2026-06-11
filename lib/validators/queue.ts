/**
 * Queue Zod Validators
 * Input validation for all queue-related API routes.
 */

import { z } from 'zod';

// ─── Queue Schemas ────────────────────────────────────────────────────────────

export const topicQueueCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  pillar: z.enum(['money', 'soul', 'curiosity']),
  description: z.string().optional(),
  queue_type: z.enum(['concept', 'dsa']),
});

export type TopicQueueCreate = z.infer<typeof topicQueueCreateSchema>;

// ─── Item Schemas ─────────────────────────────────────────────────────────────

export const topicItemCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export type TopicItemCreate = z.infer<typeof topicItemCreateSchema>;

export const topicItemUpdateSchema = z.object({
  // status: 'covered' sets item done; 'skip' is handled via action field below.
  // 'skipped' kept for backward-compat only (legacy data).
  status: z.enum(['covered', 'skipped']).optional(),
  // action: 'skip' increments skip_count and requeues at end of pending
  // action: 'move_to_top' sets sort_order to front of pending
  action: z.enum(['skip', 'move_to_top']).optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  revision: z.boolean().optional(),
  // DSA-only fields
  approach_notes: z.string().optional(),
  time_taken: z.number().positive().max(300, 'time_taken cannot exceed 300 minutes').optional(),
  solved_without_hint: z.boolean().optional(),
});

export type TopicItemUpdate = z.infer<typeof topicItemUpdateSchema>;

// ─── Reorder Schema ───────────────────────────────────────────────────────────

export const reorderSchema = z.object({
  queue_id: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().nonnegative(),
    })
  ).min(1, 'At least one item is required'),
});

export type ReorderPayload = z.infer<typeof reorderSchema>;
