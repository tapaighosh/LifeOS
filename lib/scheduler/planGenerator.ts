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
            task_id: new mongoose.Types.ObjectId(), // Fake ID for recharge
            title: `Recharge: ${rechargeItem.title}`,
            pillar: 'soul', // Recharge is usually soul
            type: 'recharge',
            energy_cost: 'low',
            status: 'pending',
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
    const recharge = context.rechargeMenu.length > 0 ? context.rechargeMenu[Math.floor(Math.random() * context.rechargeMenu.length)] : undefined;
    scheduleSlot(slot, morningTasks, recharge);
  }

  // Process Evening Slots
  const eveningSlots = context.availableSlots.filter(s => s.period === 'evening');
  for (const slot of eveningSlots) {
    const recharge = context.rechargeMenu.length > 0 ? context.rechargeMenu[Math.floor(Math.random() * context.rechargeMenu.length)] : undefined;
    scheduleSlot(slot, eveningTasks, recharge);
  }

  // Identify skipped tasks
  for (const task of tasksToSchedule) {
    if (!scheduledTaskIds.has(task._id!.toString())) {
      skippedTasks.push(task._id as mongoose.Types.ObjectId);
    }
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
