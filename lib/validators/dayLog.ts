import { z } from 'zod';

export const dayLogEntrySchema = z.object({
  task_id: z.string(),
  status: z.enum(['done', 'partial', 'skipped']),
  completion_pct: z.enum([25, 50, 75]).optional().or(z.number().refine(n => [25, 50, 75].includes(n))),
  skip_reason: z.string().optional(),
});

export const dayLogCheckinSchema = z.object({
  date: z.string(),
  entries: z.array(dayLogEntrySchema),
  energy_rating: z.number().min(1).max(5),
  reflection: z.string().max(200, 'Reflection must be at most 200 characters').optional(),
});

export type DayLogCheckinPayload = z.infer<typeof dayLogCheckinSchema>;
