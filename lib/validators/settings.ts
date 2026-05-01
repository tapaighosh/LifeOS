import { z } from 'zod';

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const TimeString = z
  .string()
  .regex(timeFormatRegex, 'Invalid time format. Must be HH:MM');

const PillarBalanceSchema = z
  .object({
    money: z.number().min(0).max(100),
    soul: z.number().min(0).max(100),
    curiosity: z.number().min(0).max(100),
  })
  .refine((data) => data.money + data.soul + data.curiosity === 100, {
    message: 'Pillar balances must sum to exactly 100',
    path: ['sum'], // attaching to a generic path or we could use specific paths
  });

export const settingsUpdateSchema = z.object({
  wake_time: TimeString.optional(),
  sleep_time: TimeString.optional(),
  leave_time: TimeString.optional(),
  return_time: TimeString.optional(),
  notification_morning: TimeString.optional(),
  notification_night: TimeString.optional(),
  timezone: z.string().optional(),
  pillar_balance_target: PillarBalanceSchema.optional(),
});

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
