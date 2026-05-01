import { z } from 'zod';

export const rechargeCreateSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  duration: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .min(5, 'Duration must be at least 5 minutes')
    .max(15, 'Duration must be 15 minutes or less'),
  favourite: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const rechargeUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  duration: z
    .number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(15, 'Duration must be 15 minutes or less')
    .optional(),
  favourite: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type RechargeCreate = z.infer<typeof rechargeCreateSchema>;
export type RechargeUpdate = z.infer<typeof rechargeUpdateSchema>;
