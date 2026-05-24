/**
 * Task Zod Validation Schemas
 *
 * Two schemas are exported:
 *  - taskCreateSchema — validates all required fields on POST /api/tasks
 *  - taskUpdateSchema — partial, all fields optional, used on PATCH /api/tasks/:id
 *
 * Conditional rule: when type === "recharge", duration must be <= 15.
 * This is enforced with Zod's `.superRefine()` for a precise field-level error.
 *
 * TypeScript types are inferred directly from schemas so API routes and
 * the frontend form stay in sync with zero duplication.
 */

import { z } from 'zod';

// ─── Shared Field Definitions ─────────────────────────────────────────────────

const ALLOWED_DURATIONS = [15, 30, 45, 60, 90, 120] as const;

const PillarEnum = z.enum(['money', 'soul', 'curiosity'], {
  error: 'Pillar must be one of: money, soul, curiosity',
});

const TypeEnum = z.enum(['recurring', 'one-time', 'project', 'recharge'], {
  error: 'Type must be one of: recurring, one-time, project, recharge',
});

const EnergyCostEnum = z.enum(['high', 'medium', 'low'], {
  error: 'Energy cost must be one of: high, medium, low',
});

const SlotPreferenceEnum = z.enum(['morning', 'evening', 'any'], {
  error: 'Slot preference must be one of: morning, evening, any',
});

const FrequencyEnum = z.enum(['daily', 'alternate', '3x_week', 'weekly', 'custom'], {
  error: 'Frequency must be one of: daily, alternate, 3x_week, weekly, custom',
});

const DurationSchema = z
  .number({ error: 'Duration must be a number' })
  .refine((d) => (ALLOWED_DURATIONS as readonly number[]).includes(d), {
    message: 'Duration must be one of: 15, 30, 45, 60, 90, 120 minutes',
  });

// ─── Recharge Duration Refinement ────────────────────────────────────────────

// Standalone refinement function reused in both schemas
const rechargeRefinement = (data: { type?: string; duration?: number }, ctx: z.RefinementCtx) => {
  if (data.type === 'recharge' && data.duration !== undefined && data.duration > 15) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Recharge tasks must have a duration of 15 minutes or less',
      path: ['duration'],
    });
  }
};

// ─── taskCreateSchema ─────────────────────────────────────────────────────────

export const taskCreateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),

    pillar: PillarEnum,

    category: z
      .string()
      .max(100, 'Category cannot exceed 100 characters')
      .trim()
      .optional(),

    type: TypeEnum,

    duration: DurationSchema,

    energy_cost: EnergyCostEnum,

    slot_preference: SlotPreferenceEnum.default('any'),

    frequency: FrequencyEnum.optional(),

    revision: z.boolean().default(false),

    revision_cycle: z
      .array(z.number().positive())
      .min(1, 'Revision cycle must have at least one interval')
      .default([1, 3, 7, 14]),

    priority: z
      .number()
      .int('Priority must be an integer')
      .min(1, 'Priority must be at least 1')
      .max(5, 'Priority cannot exceed 5')
      .default(3),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),

    active: z.boolean().default(true),
  })
  .superRefine(rechargeRefinement);

// ─── taskUpdateSchema ─────────────────────────────────────────────────────────

/**
 * All fields are optional for PATCH semantics.
 * The recharge duration rule still applies if both type and duration are provided.
 */
export const taskUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim()
      .optional(),

    pillar: PillarEnum.optional(),

    category: z
      .string()
      .max(100, 'Category cannot exceed 100 characters')
      .trim()
      .optional(),

    type: TypeEnum.optional(),

    duration: DurationSchema.optional(),

    energy_cost: EnergyCostEnum.optional(),

    slot_preference: SlotPreferenceEnum.optional(),

    frequency: FrequencyEnum.optional(),

    revision: z.boolean().optional(),

    revision_cycle: z
      .array(z.number().positive())
      .min(1, 'Revision cycle must have at least one interval')
      .optional(),

    priority: z
      .number()
      .int('Priority must be an integer')
      .min(1, 'Priority must be at least 1')
      .max(5, 'Priority cannot exceed 5')
      .optional(),

    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional(),

    active: z.boolean().optional(),
  })
  .superRefine(rechargeRefinement);

// ─── Query Params Schema ──────────────────────────────────────────────────────

export const taskQuerySchema = z.object({
  pillar: PillarEnum.optional(),
  type: TypeEnum.optional(),
  energy_cost: EnergyCostEnum.optional(),
  active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
