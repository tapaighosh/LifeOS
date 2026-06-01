import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enum — kept in one place so models and validators stay in sync
// ---------------------------------------------------------------------------
export const NOTEBOOK_COLORS = ['amber', 'blue', 'rose', 'emerald', 'indigo', 'zinc'] as const;
export type NotebookColorValue = (typeof NOTEBOOK_COLORS)[number];

// ---------------------------------------------------------------------------
// NotebookTopic — create / update input
//
// `entry_count`, `last_entry_on`, `active`, and `user_id` are managed
// internally and are intentionally excluded from the user-facing schema.
// ---------------------------------------------------------------------------

/**
 * Used by:
 *  - POST /api/notebook/topics   (create a new topic)
 *  - PATCH /api/notebook/topics/[id]  (update title, icon, color, pinned)
 */
export const NotebookTopicSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(60, 'Title cannot exceed 60 characters')
    .trim(),
  icon: z
    .string({ message: 'Icon is required' })
    .min(1, 'Icon cannot be empty')
    .max(4, 'Icon must be a single emoji (max 4 chars)'),
  color: z.enum(NOTEBOOK_COLORS, {
    message: `Color must be one of: ${NOTEBOOK_COLORS.join(', ')}`,
  }),
  pinned: z.boolean().optional(),
});

export type NotebookTopicInput = z.infer<typeof NotebookTopicSchema>;

// ---------------------------------------------------------------------------
// NotebookEntry — create input
//
// `topic_id` is taken from the URL param, not the request body.
// `created_at` is set server-side.
// ---------------------------------------------------------------------------

/**
 * Used by:
 *  - POST /api/notebook/topics/[id]/entries  (add a note to a topic)
 */
export const NotebookEntrySchema = z.object({
  body: z
    .string({ message: 'Body is required' })
    .min(1, 'Body cannot be empty')
    .max(5000, 'Body cannot exceed 5 000 characters')
    .trim(),
  source: z
    .string()
    .max(100, 'Source cannot exceed 100 characters')
    .trim()
    .optional()
    .default(''),
  tags: z
    .array(
      z
        .string()
        .max(30, 'Each tag cannot exceed 30 characters')
        .trim()
    )
    .max(5, 'A note can have at most 5 tags')
    .optional()
    .default([]),
});

export type NotebookEntryInput = z.infer<typeof NotebookEntrySchema>;
