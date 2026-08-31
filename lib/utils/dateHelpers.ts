import { toZonedTime, format } from 'date-fns-tz';

/**
 * Returns the user's current local date as YYYY-MM-DD.
 * Uses the IANA timezone string from UserSettings (e.g. 'Asia/Kolkata').
 *
 * ⚠️  NEVER use `new Date().toISOString().split('T')[0]` on the server.
 *     That produces a UTC date and is wrong for all non-UTC users.
 *
 * @example
 *   // For an IST user at 11:45 PM local time:
 *   getTodayInTimezone('Asia/Kolkata') // → '2026-08-31'  ✓
 *   new Date().toISOString().split('T')[0] // → '2026-08-30'  ✗ (UTC is yesterday)
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * Returns a date offset from today in the user's timezone, formatted as YYYY-MM-DD.
 * daysOffset: negative = past, positive = future.
 *
 * @example
 *   getOffsetDateInTimezone('Asia/Kolkata', -7) // → 7 days ago in IST
 *   getOffsetDateInTimezone('Asia/Kolkata', 1)  // → tomorrow in IST
 */
export function getOffsetDateInTimezone(timezone: string, daysOffset: number): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + daysOffset);
  const zoned = toZonedTime(now, timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone });
}
