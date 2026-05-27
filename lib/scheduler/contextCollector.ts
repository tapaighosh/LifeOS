import mongoose from 'mongoose';
import { IUserSettings } from '@/models/UserSettings';
import EventBlock from '@/models/EventBlock';
import Task, { ITask } from '@/models/Task';
import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import RechargeItem, { IRechargeItem } from '@/models/RechargeItem';
import { buildRevisionTasksForDate } from '@/lib/revision/revisionEngine';
import { buildQueueContextForPlan, QueueCandidate } from '@/lib/queues/queueEngine';
import { calculateAvailableSlots, TimeSlot } from './slotCalculator';

export interface PlanContext {
  targetDate: string;
  date: string;                      // alias for AI promptBuilder
  dayOfWeek: number;
  availableSlots: TimeSlot[];
  slots: TimeSlot[];                  // alias for AI promptBuilder
  carryoverTasks: ITask[];
  todayTasks: ITask[];
  revisionTasks: Partial<ITask>[];
  rechargeMenu: IRechargeItem[];
  pendingTasks: ITask[];             // merged list for AI promptBuilder
  energyRatings7d: number[];
  energyHistory: number[];           // alias for AI promptBuilder
  pillarBalance7d: { money: number; soul: number; curiosity: number };
  pillarBalance: { money: number; soul: number; curiosity: number }; // alias
  /** Active queue candidates for plan injection — one topic per pillar max */
  queueCandidates: QueueCandidate[];
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

  const sevenDaysAgo = new Date(startOfDay);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const weekPlans = await DailyPlan.find({
    date: { $gte: sevenDaysAgoStr, $lt: targetDate },
  }).lean();

  const recentPlans = weekPlans.filter(p => p.date >= threeDaysAgoStr);

  const incompleteTaskIds = new Set<string>();
  for (const plan of recentPlans) {
    for (const entry of plan.plan) {
      if (entry.status === 'pending' || entry.status === 'partial') {
        // Skip queue_topic entries — they have no task_id
        if (entry.entry_type === 'queue_topic' || !entry.task_id) continue;
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

  // 4. Today's recurring/one-time tasks — frequency-aware filtering
  // Bug Fix 1: proper frequency logic instead of static ['daily'] array
  function isTaskDueToday(task: ITask, dow: number): boolean {
    if (!task.frequency) return task.type !== 'recurring';
    switch (task.frequency) {
      case 'daily': return true;
      case 'alternate': {
        const targetTime = new Date(targetDate).getTime();
        const daysSinceCreation = Math.floor(
          (targetTime - new Date((task as any).createdAt).getTime()) / 86400000
        );
        return daysSinceCreation % 2 === 0;
      }
      case '3x_week': return [1, 3, 5].includes(dow); // Mon/Wed/Fri
      case 'weekly': return dow === 1;                  // Monday
      default: return true;                             // 'custom' — include by default
    }
  }

  const allActiveTasks = await Task.find({ active: true }).lean();
  const todayTasks = allActiveTasks.filter((t) => isTaskDueToday(t as ITask, dayOfWeek)) as ITask[];

  // 5. Revision queue due today (uses revisionEngine for cap + deferral)
  const { revisionPseudoTasks: revisionTasks } = await buildRevisionTasksForDate(targetDate);

  // 6. Last 7 days energy ratings
  const dayLogs = await DayLog.find({
    date: { $gte: sevenDaysAgoStr, $lt: targetDate }
  }).lean();
  const energyRatings7d = dayLogs.map(l => l.energy_rating).filter(r => r !== undefined);

  // 7. Pillar balance for the week
  let moneyCompleted = 0;
  let soulCompleted = 0;
  let curiosityCompleted = 0;

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

  // 9. Queue candidates for plan injection
  const queueCandidates = await buildQueueContextForPlan();

  // Merge all tasks for AI promptBuilder (unique by id)
  const pendingTaskMap = new Map<string, ITask>();
  for (const t of [...carryoverTasks, ...todayTasks]) {
    const id = (t as any)._id?.toString();
    if (id) pendingTaskMap.set(id, t as ITask);
  }
  const pendingTasks = Array.from(pendingTaskMap.values());

  return {
    targetDate,
    date: targetDate,
    dayOfWeek,
    availableSlots,
    slots: availableSlots,
    carryoverTasks: carryoverTasks as ITask[],
    todayTasks,
    revisionTasks,
    rechargeMenu: rechargeMenu as IRechargeItem[],
    pendingTasks,
    energyRatings7d,
    energyHistory: energyRatings7d,
    pillarBalance7d,
    pillarBalance: pillarBalance7d,
    queueCandidates,
  };
}
