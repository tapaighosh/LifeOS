import mongoose from 'mongoose';
import { IUserSettings } from '@/models/UserSettings';
import EventBlock from '@/models/EventBlock';
import Task, { ITask } from '@/models/Task';
import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import RechargeItem, { IRechargeItem } from '@/models/RechargeItem';
import RevisionQueue from '@/models/RevisionQueue';
import { calculateAvailableSlots, TimeSlot } from './slotCalculator';

export interface PlanContext {
  targetDate: string;
  dayOfWeek: number;
  availableSlots: TimeSlot[];
  carryoverTasks: ITask[];
  todayTasks: ITask[];
  revisionTasks: ITask[];
  rechargeMenu: IRechargeItem[];
  energyRatings7d: number[];
  pillarBalance7d: { money: number; soul: number; curiosity: number };
}

export async function collectPlanContext(
  targetDate: string,
  settings: IUserSettings
): Promise<PlanContext> {
  const dateObj = new Date(targetDate);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Fetch EventBlocks
  const eventBlocks = await EventBlock.find({
    date_start: { $lt: endOfDay },
    date_end: { $gt: startOfDay },
  }).lean();

  // 2. Calculate Available Slots
  // @ts-ignore
  const availableSlots = calculateAvailableSlots(targetDate, settings, eventBlocks);

  // 3. Gather Incomplete tasks from last 3 days (max 3 carryovers)
  const threeDaysAgo = new Date(startOfDay);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  const recentPlans = await DailyPlan.find({
    date: { $gte: threeDaysAgoStr, $lt: targetDate },
  }).lean();

  const incompleteTaskIds = new Set<string>();
  for (const plan of recentPlans) {
    for (const entry of plan.plan) {
      if (entry.status === 'pending' || entry.status === 'partial') {
        incompleteTaskIds.add(entry.task_id.toString());
      }
    }
  }

  // Fetch the actual tasks, limit to 3
  const carryoverTasks = await Task.find({
    _id: { $in: Array.from(incompleteTaskIds) },
    active: true,
  })
    .limit(3)
    .lean();

  // 4. Today's recurring/one-time tasks
  // For simplicity: match 'daily', match 'weekly' if day matches, etc.
  // Real implementation for frequency would be more robust.
  const frequencyMatch: string[] = ['daily'];
  // Assuming a custom mapping, e.g. alternate, 3x_week etc. (Simplified)
  // For 'weekly', it might trigger on a specific day. Let's just pull 'daily' and 'one-time' without strict logic for 'custom'.
  
  const todayTasks = await Task.find({
    active: true,
    $or: [
      { type: 'recurring', frequency: { $in: frequencyMatch } },
      { type: 'one-time' }, // In reality we'd check a due date if they had one
      { type: 'project' }
    ]
  }).lean();

  // 5. Revision queue due today
  const revisions = await RevisionQueue.find({
    next_review_date: { $lte: endOfDay },
    completed: false
  }).populate('task_id').lean();

  const revisionTasks: ITask[] = [];
  for (const rev of revisions) {
    if (rev.task_id && (rev.task_id as any).active) {
      revisionTasks.push(rev.task_id as any);
    }
  }

  // 6. Last 7 days energy ratings
  const sevenDaysAgo = new Date(startOfDay);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const dayLogs = await DayLog.find({
    date: { $gte: sevenDaysAgoStr, $lt: targetDate }
  }).lean();
  const energyRatings7d = dayLogs.map(l => l.energy_rating).filter(r => r !== undefined);

  // 7. Pillar balance for the week
  let moneyCompleted = 0;
  let soulCompleted = 0;
  let curiosityCompleted = 0;

  const weekPlans = await DailyPlan.find({
    date: { $gte: sevenDaysAgoStr, $lt: targetDate },
  }).lean();

  for (const plan of weekPlans) {
    for (const entry of plan.plan) {
      if (entry.status === 'done') {
        if (entry.pillar === 'money') moneyCompleted++;
        if (entry.pillar === 'soul') soulCompleted++;
        if (entry.pillar === 'curiosity') curiosityCompleted++;
      }
    }
  }

  const totalCompleted = moneyCompleted + soulCompleted + curiosityCompleted;
  const pillarBalance7d = {
    money: totalCompleted ? Math.round((moneyCompleted / totalCompleted) * 100) : 0,
    soul: totalCompleted ? Math.round((soulCompleted / totalCompleted) * 100) : 0,
    curiosity: totalCompleted ? Math.round((curiosityCompleted / totalCompleted) * 100) : 0,
  };

  // 8. Recharge menu
  const rechargeMenu = await RechargeItem.find({ active: true }).lean();

  return {
    targetDate,
    dayOfWeek,
    availableSlots,
    // @ts-ignore
    carryoverTasks,
    // @ts-ignore
    todayTasks,
    // @ts-ignore
    revisionTasks,
    // @ts-ignore
    rechargeMenu,
    energyRatings7d,
    pillarBalance7d,
  };
}
