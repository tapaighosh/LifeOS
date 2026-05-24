import mongoose from 'mongoose';
import { PlanContext } from './contextCollector';
import { TimeSlot } from './slotCalculator';
import { IPlanEntry } from '@/models/DailyPlan';
import { ITask } from '@/models/Task';
import { IRechargeItem } from '@/models/RechargeItem';

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function generatePlan(context: PlanContext) {
  // Combine all tasks (unique by ID)
  const allTasksMap = new Map<string, ITask>();
  
  const processTask = (t: ITask) => {
    const id = t._id?.toString();
    if (id && !allTasksMap.has(id)) {
      allTasksMap.set(id, t);
    }
  };

  context.carryoverTasks.forEach(processTask);
  (context.revisionTasks as ITask[]).forEach(processTask);
  context.todayTasks.forEach(processTask);

  let tasksToSchedule = Array.from(allTasksMap.values());

  // Sort tasks: Priority DESC, then Energy Cost
  const energyWeight = { high: 3, medium: 2, low: 1 };
  
  // Sort for Morning (Energy DESC)
  const morningTasks = [...tasksToSchedule].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return energyWeight[b.energy_cost] - energyWeight[a.energy_cost];
  });

  // Sort for Evening (Energy ASC)
  const eveningTasks = [...tasksToSchedule].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return energyWeight[a.energy_cost] - energyWeight[b.energy_cost];
  });

  const planEntries: IPlanEntry[] = [];
  const skippedTasks: mongoose.Types.ObjectId[] = [];
  const scheduledTaskIds = new Set<string>();

  const scheduleSlot = (
    slot: TimeSlot,
    sortedTasks: ITask[],
    rechargeItem?: IRechargeItem
  ) => {
    let currentTime = new Date(slot.start);
    let remainingMinutes = slot.duration;
    
    // Determine midpoint for recharge
    let rechargeInserted = false;
    const midpoint = slot.duration / 2;

    for (const task of sortedTasks) {
      if (scheduledTaskIds.has(task._id!.toString())) continue;
      
      // If we crossed midpoint and have a recharge item, insert it
      if (rechargeItem && !rechargeInserted && (slot.duration - remainingMinutes) >= midpoint) {
        if (remainingMinutes >= rechargeItem.duration) {
          const endTime = addMinutes(currentTime, rechargeItem.duration);
          planEntries.push({
            time_start: formatTime(currentTime),
            time_end: formatTime(endTime),
            task_id: rechargeItem._id as mongoose.Types.ObjectId, // Bug A fix: use real RechargeItem._id
            title: `Recharge: ${rechargeItem.title}`,
            pillar: 'soul',
            type: 'recharge',
            energy_cost: 'low',
            status: 'pending',
            entry_type: 'recharge', // Distinguishes break entries from real tasks
          });
          currentTime = endTime;
          remainingMinutes -= rechargeItem.duration;
          rechargeInserted = true;
        }
      }

      // Check "Never schedule high energy in last 30 min of window"
      if (task.energy_cost === 'high' && remainingMinutes <= 30) {
        continue; // Try next task
      }

      if (remainingMinutes >= task.duration) {
        // Slot fits
        const endTime = addMinutes(currentTime, task.duration);
        planEntries.push({
          time_start: formatTime(currentTime),
          time_end: formatTime(endTime),
          task_id: task._id as mongoose.Types.ObjectId,
          title: task.title,
          pillar: task.pillar,
          type: task.type,
          energy_cost: task.energy_cost,
          status: 'pending',
          entry_type: 'task',
        });
        
        scheduledTaskIds.add(task._id!.toString());
        currentTime = endTime;
        remainingMinutes -= task.duration;
      }
    }
  };

  // Process Morning Slots
  const morningSlots = context.availableSlots.filter(s => s.period === 'morning');
  for (const slot of morningSlots) {
    // Bug Fix 2: prefer favourite recharge items
    const favouritePool = context.rechargeMenu.filter((r) => (r as any).favourite);
    const rechargePool = favouritePool.length > 0 ? favouritePool : context.rechargeMenu;
    const recharge = rechargePool.length > 0
      ? rechargePool[Math.floor(Math.random() * rechargePool.length)]
      : undefined;
    scheduleSlot(slot, morningTasks, recharge);
  }

  // Process Evening Slots
  const eveningSlots = context.availableSlots.filter(s => s.period === 'evening');
  for (const slot of eveningSlots) {
    // Bug Fix 2: prefer favourite recharge items
    const favouritePool = context.rechargeMenu.filter((r) => (r as any).favourite);
    const rechargePool = favouritePool.length > 0 ? favouritePool : context.rechargeMenu;
    const recharge = rechargePool.length > 0
      ? rechargePool[Math.floor(Math.random() * rechargePool.length)]
      : undefined;
    scheduleSlot(slot, eveningTasks, recharge);
  }

  // Identify skipped tasks
  for (const task of tasksToSchedule) {
    if (!scheduledTaskIds.has(task._id!.toString())) {
      skippedTasks.push(task._id as mongoose.Types.ObjectId);
    }
  }

  // ─── Queue Topic Injection ────────────────────────────────────────────────
  // Injects up to 2 learning topics per day when a pillar is neglected (<33%).
  // Queue entries use entry_type='queue_topic' and topic_item_id (not task_id).
  // Time slots are placeholder '00:00' — the AI promptBuilder or manual plan
  // can assign them to actual open slots.
  const QUEUE_TOPIC_CAP = 2;
  let queueTopicsAdded = 0;
  const totalPillarCompleted = Object.values(context.pillarBalance7d).reduce(
    (sum, val) => sum + val,
    0
  );

  for (const candidate of (context.queueCandidates ?? [])) {
    if (queueTopicsAdded >= QUEUE_TOPIC_CAP) break;
    if (!candidate.nextItem) continue;

    // Only inject when the pillar is below 33% of recent completions
    const pillarPct = totalPillarCompleted > 0
      ? context.pillarBalance7d[candidate.pillar]
      : 0;
    if (pillarPct > 33) continue;

    const prefix = candidate.queue_type === 'dsa' ? 'Solve' : 'Study';

    planEntries.push({
      time_start: '00:00',   // placeholder — AI or user assigns the real slot
      time_end: '00:00',
      topic_item_id: (candidate.nextItem as any)._id as mongoose.Types.ObjectId,
      title: `${prefix}: ${candidate.nextItem.title}`,
      pillar: candidate.pillar,
      type: 'one-time',
      energy_cost: 'low',
      status: 'pending',
      entry_type: 'queue_topic',
    } as IPlanEntry);

    queueTopicsAdded++;
  }

  return {
    date: context.targetDate,
    plan: planEntries,
    ai_note: 'Plan generated using rule-based algorithms due to time constraints.',
    source: 'rule-based',
    skipped_tasks: skippedTasks,
    locked: false,
    paused: false,
  };
}
