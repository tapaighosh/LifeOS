import { z } from 'zod';

/**
 * Zod schema for validating Principle create/update API input.
 *
 * Used in:
 *  - POST /api/principles   (create)
 *  - PATCH /api/principles/[id] (update heading / body)
 *
 * Note: `show_order`, `last_shown`, and `active` are managed internally
 * by the scheduler — they are intentionally excluded from this user-facing schema.
 */
export const PrincipleSchema = z.object({
  heading: z
    .string({ required_error: 'Heading is required' })
    .min(1, 'Heading cannot be empty')
    .max(120, 'Heading cannot exceed 120 characters')
    .trim(),
  body: z
    .string({ required_error: 'Body is required' })
    .min(1, 'Body cannot be empty')
    .max(500, 'Body cannot exceed 500 characters')
    .trim(),
});

export type PrincipleInput = z.infer<typeof PrincipleSchema>;
