/**
 * Challenge Zod Validators
 *
 * challengeAcceptSchema  — validates the body for POST /api/challenges/accept
 * challengeUpdateSchema  — validates the body for PATCH /api/challenges/[id]
 */

import { z } from 'zod';

// ─── Accept Challenge ─────────────────────────────────────────────────────────

/**
 * Used when a user picks a challenge from the library and accepts it.
 * `library_id` must match a valid entry in CHALLENGE_LIBRARY.
 * `frequency` is optional — if omitted, the library item's suggested_frequency is used.
 */
export const challengeAcceptSchema = z.object({
  library_id: z.string().min(1, 'Library ID is required'),
  pillar: z.enum(['money', 'soul', 'curiosity'], {
    error: 'Pillar must be money, soul, or curiosity',
  }),
  frequency: z
    .enum(['daily', 'alternate', '3x_week', 'weekly'], {
      error: 'Frequency must be one of: daily, alternate, 3x_week, weekly',
    })
    .optional(),
});

export type ChallengeAccept = z.infer<typeof challengeAcceptSchema>;

// ─── Update Challenge ─────────────────────────────────────────────────────────

/**
 * Used for PATCH /api/challenges/[id].
 * Only `status` and `notes` can be updated by the user directly.
 * Progress fields (streak, total_completed) are updated exclusively by the check-in hook.
 */
export const challengeUpdateSchema = z
  .object({
    status: z
      .enum(['dropped', 'paused', 'active'], {
        error: 'Status must be one of: dropped, paused, active',
      })
      .optional(),
    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

export type ChallengeUpdate = z.infer<typeof challengeUpdateSchema>;
