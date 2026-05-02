import { IUserSettings } from '@/models/UserSettings';
import { IEventBlock } from '@/models/EventBlock';

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  period: 'morning' | 'evening';
}

function parseTimeStr(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function calculateAvailableSlots(
  targetDate: string, // YYYY-MM-DD
  settings: IUserSettings,
  eventBlocks: IEventBlock[]
): TimeSlot[] {
  // 1. Determine base windows
  const wakeDate = parseTimeStr(targetDate, settings.wake_time);
  const leaveDate = parseTimeStr(targetDate, settings.leave_time);
  const returnDate = parseTimeStr(targetDate, settings.return_time);
  const sleepDate = parseTimeStr(targetDate, settings.sleep_time);

  // Handle case where sleep crosses midnight
  if (sleepDate < returnDate) {
    sleepDate.setDate(sleepDate.getDate() + 1);
  }

  const baseSlots: TimeSlot[] = [];

  // If it's a day off, we might treat it differently, but for now we follow BRD:
  // "morning window (wake→leave) and evening window (return→sleep)"
  // If the user has a day off, maybe they don't have leave/return times, but the schema has defaults.
  // We'll calculate morning and evening. If leave_time is before wake_time, we skip morning.
  
  if (leaveDate > wakeDate) {
    baseSlots.push({
      start: wakeDate,
      end: leaveDate,
      duration: (leaveDate.getTime() - wakeDate.getTime()) / 60000,
      period: 'morning',
    });
  }

  if (sleepDate > returnDate) {
    baseSlots.push({
      start: returnDate,
      end: sleepDate,
      duration: (sleepDate.getTime() - returnDate.getTime()) / 60000,
      period: 'evening',
    });
  }

  // 2. Subtract event blocks
  let availableSlots: TimeSlot[] = [...baseSlots];

  for (const block of eventBlocks) {
    const blockStart = new Date(block.date_start);
    const blockEnd = new Date(block.date_end);

    const newSlots: TimeSlot[] = [];
    
    for (const slot of availableSlots) {
      if (blockEnd <= slot.start || blockStart >= slot.end) {
        // No overlap
        newSlots.push(slot);
      } else if (blockStart <= slot.start && blockEnd >= slot.end) {
        // Complete overlap, slot is consumed (do not push to newSlots)
      } else if (blockStart > slot.start && blockEnd < slot.end) {
        // Split slot into two
        newSlots.push({
          start: slot.start,
          end: blockStart,
          duration: (blockStart.getTime() - slot.start.getTime()) / 60000,
          period: slot.period,
        });
        newSlots.push({
          start: blockEnd,
          end: slot.end,
          duration: (slot.end.getTime() - blockEnd.getTime()) / 60000,
          period: slot.period,
        });
      } else if (blockStart <= slot.start && blockEnd < slot.end) {
        // Overlap at start
        newSlots.push({
          start: blockEnd,
          end: slot.end,
          duration: (slot.end.getTime() - blockEnd.getTime()) / 60000,
          period: slot.period,
        });
      } else if (blockStart > slot.start && blockEnd >= slot.end) {
        // Overlap at end
        newSlots.push({
          start: slot.start,
          end: blockStart,
          duration: (blockStart.getTime() - slot.start.getTime()) / 60000,
          period: slot.period,
        });
      }
    }
    availableSlots = newSlots;
  }

  // Filter out slots that are too small (e.g. < 15 mins)
  return availableSlots.filter(s => s.duration >= 15);
}
