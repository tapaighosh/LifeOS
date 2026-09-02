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

  // ─── GAP-03: Minimum Pillar Guarantee (Floor Allocation) ─────────────────
  // Read from user-configured pillar_balance_target (injected via context.pillarBalance7d context
  // was computed from actual pillar_balance_target in generate/route) — NOT hardcoded 33/33/33.
  // context.pillarBalance = IDailyPlan-level aggregation; targetPillars = IDailyPlan-level config.
  // Use context.userPillarTargets if injected; otherwise safe fallback matches schema default 40/30/30.
  const userPillarTargets = context.userPillarTargets;
  const NEGLECT_FACTOR = 0.6;

  const neglectedPillars = new Set<'money' | 'soul' | 'curiosity'>();
  const totalCompleted = Object.values(context.pillarBalance7d).reduce((a, b) => a + b, 0);
  if (totalCompleted > 0) {
    (['money', 'soul', 'curiosity'] as const).forEach((pillar) => {
      const pct = context.pillarBalance7d[pillar];
      if (pct < userPillarTargets[pillar] * NEGLECT_FACTOR) {
        neglectedPillars.add(pillar);
      }
    });
  }

  // Extract reserved tasks for neglected pillars
  const reservedTaskIds = new Set<string>();
  const reservedTasks: ITask[] = [];
  for (const pillar of Array.from(neglectedPillars)) {
    const candidate = tasksToSchedule.find((t) => t.pillar === pillar && !reservedTaskIds.has(t._id!.toString()));
    if (candidate) {
      reservedTaskIds.add(candidate._id!.toString());
      reservedTasks.push(candidate);
    }
  }

  const remainingTasks = tasksToSchedule.filter((t) => !reservedTaskIds.has(t._id!.toString()));

  // Sort tasks: Priority DESC, then Energy Cost
  const energyWeight = { high: 3, medium: 2, low: 1 };
  
  // Morning candidate pool: reserved neglected tasks first, then general sorted
  const morningSortedRemaining = [...remainingTasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return energyWeight[b.energy_cost] - energyWeight[a.energy_cost];
  });
  const morningTasks = [...reservedTasks, ...morningSortedRemaining];

  // Evening candidate pool
  const eveningSortedRemaining = [...remainingTasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return energyWeight[a.energy_cost] - energyWeight[b.energy_cost];
  });
  const eveningTasks = [...reservedTasks, ...eveningSortedRemaining];

  const planEntries: IPlanEntry[] = [];
  const skippedTasks: mongoose.Types.ObjectId[] = [];
  const scheduledTaskIds = new Set<string>();

  // Capacity calculation
  const gross_capacity_minutes = context.availableSlots.reduce((sum, s) => sum + s.duration, 0);
  const OVERHEAD_BUDGET = 30; // 30 mins default buffer for bio breaks / transitions
  const net_capacity_minutes = Math.max(0, gross_capacity_minutes - OVERHEAD_BUDGET);

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
            task_id: rechargeItem._id as mongoose.Types.ObjectId,
            title: `Recharge: ${rechargeItem.title}`,
            pillar: 'soul',
            type: 'recharge',
            energy_cost: 'low',
            status: 'planned', // Updated to 'planned'
            entry_type: 'recharge',
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
          status: 'planned', // Updated to 'planned'
          entry_type: 'task',
        });
        
        scheduledTaskIds.add(task._id!.toString());
        currentTime = endTime;
        remainingMinutes -= task.duration;
      }
    }
  };

  // ─── BUG-24: Shuffle recharge pool once for the whole day ─────────────────
  function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const favouritePool = context.rechargeMenu.filter((r) => (r as any).favourite);
  const basePool = favouritePool.length > 0 ? favouritePool : context.rechargeMenu;
  const shuffledRechargePool = shuffleArray(basePool);
  let rechargePoolIndex = 0;

  // Process Morning Slots
  const morningSlots = context.availableSlots.filter(s => s.period === 'morning');
  for (const slot of morningSlots) {
    const recharge = shuffledRechargePool.length > 0
      ? shuffledRechargePool[rechargePoolIndex++ % shuffledRechargePool.length]
      : undefined;
    scheduleSlot(slot, morningTasks, recharge);
  }

  // Process Evening Slots
  const eveningSlots = context.availableSlots.filter(s => s.period === 'evening');
  for (const slot of eveningSlots) {
    const recharge = shuffledRechargePool.length > 0
      ? shuffledRechargePool[rechargePoolIndex++ % shuffledRechargePool.length]
      : undefined;
    scheduleSlot(slot, eveningTasks, recharge);
  }

  // Identify skipped tasks
  for (const task of tasksToSchedule) {
    if (!scheduledTaskIds.has(task._id!.toString())) {
      skippedTasks.push(task._id as mongoose.Types.ObjectId);
    }
  }

  // ─── Queue Topic Injection ─────────────────────────────────────────────────
  const DEFAULT_QUEUE_TOPIC_DURATION = 30; // minutes
  const QUEUE_TOPIC_CAP = 2;
  let queueTopicsAdded = 0;

  for (const candidate of (context.queueCandidates ?? [])) {
    if (queueTopicsAdded >= QUEUE_TOPIC_CAP) break;
    if (!candidate.nextItem) continue;

    // Only inject when the pillar is below 33% of recent completions
    const pillarPct = totalCompleted > 0
      ? context.pillarBalance7d[candidate.pillar]
      : 0;
    if (pillarPct > 33) continue;

    // Find first free gap across all available slots
    let assignedStart: string | null = null;
    let assignedEnd: string | null = null;

    for (const slot of context.availableSlots) {
      const slotStartStr = formatTime(slot.start);
      const slotEndStr = formatTime(slot.end);

      // Entries scheduled in this slot's time window
      const occupiedInSlot = planEntries
        .filter((e) => e.time_start >= slotStartStr && e.time_end <= slotEndStr)
        .sort((a, b) => a.time_start.localeCompare(b.time_start));

      // Gap starts after the last scheduled entry in this slot (or at slot start)
      const gapStart = occupiedInSlot.length > 0
        ? occupiedInSlot[occupiedInSlot.length - 1].time_end
        : slotStartStr;

      const [gh, gm] = gapStart.split(':').map(Number);
      const [eh, em] = slotEndStr.split(':').map(Number);
      const remainingMinutes = (eh * 60 + em) - (gh * 60 + gm);

      if (remainingMinutes >= DEFAULT_QUEUE_TOPIC_DURATION) {
        assignedStart = gapStart;
        const endTotal = gh * 60 + gm + DEFAULT_QUEUE_TOPIC_DURATION;
        assignedEnd = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
        break;
      }
    }

    const prefix = candidate.queue_type === 'dsa' ? 'Solve' : 'Study';

    planEntries.push({
      time_start: assignedStart ?? '00:00',
      time_end: assignedEnd ?? '00:00',
      topic_item_id: (candidate.nextItem as any)._id as mongoose.Types.ObjectId,
      title: `${prefix}: ${candidate.nextItem.title}`,
      pillar: candidate.pillar,
      type: 'one-time',
      energy_cost: 'low',
      status: 'planned', // Updated to 'planned'
      entry_type: 'queue_topic',
    } as IPlanEntry);

    queueTopicsAdded++;
  }

  // Compute scheduled minutes
  const scheduled_minutes = planEntries.reduce((sum, entry) => {
    if (!entry.time_start || !entry.time_end || entry.time_start === '00:00') return sum;
    const [sh, sm] = entry.time_start.split(':').map(Number);
    const [eh, em] = entry.time_end.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);

  return {
    date: context.targetDate,
    plan: planEntries,
    ai_note: 'Plan generated using rule-based algorithms due to time constraints.',
    source: 'rule-based' as const,
    skipped_tasks: skippedTasks,
    displaced_tasks: [],
    locked: false,
    paused: false,
    plan_status: 'draft' as const,
    gross_capacity_minutes,
    net_capacity_minutes,
    scheduled_minutes,
    scheduledTaskIds: Array.from(scheduledTaskIds),
  };
}
