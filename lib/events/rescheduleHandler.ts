import { IEventBlock } from '@/models/EventBlock';
import Task from '@/models/Task';
import DailyPlan from '@/models/DailyPlan';

export async function handleEventCreated(event: IEventBlock) {
  // 1. Auto-create prep task for travel
  if (event.type === 'travel' && !event.prep_task_added) {
    const prepDate = new Date(event.date_start);
    prepDate.setDate(prepDate.getDate() - 2);
    
    // We create a one-time task for preparation
    await Task.create({
      title: `Pack and prepare for travel: ${event.label}`,
      pillar: 'money', // Defaulting to money or could be soul
      type: 'one-time',
      duration: 60,
      energy_cost: 'medium',
      priority: 5,
      active: true,
      notes: `Auto-generated prep task for event starting on ${event.date_start.toDateString()}`,
    });

    event.prep_task_added = true;
    await event.save();
  }

  // 2. Displaced tasks logic
  // Find if there is an existing DailyPlan that overlaps with this event's dates
  // Since DailyPlan dates are 'YYYY-MM-DD', we find plans between event start and end.
  const startDateStr = event.date_start.toISOString().split('T')[0];
  const endDateStr = event.date_end.toISOString().split('T')[0];

  const affectedPlans = await DailyPlan.find({
    date: { $gte: startDateStr, $lte: endDateStr },
    locked: false, // Don't mess with locked plans automatically
  });

  for (const plan of affectedPlans) {
    const displacedTasks = [];
    const keptEntries = [];

    for (const entry of plan.plan) {
      // Check if entry time overlaps with event
      // To be precise, we should convert entry time back to Date and check overlap.
      // For simplicity, if it's a full day event, all tasks are displaced.
      const isFullDay = ['trek', 'travel', 'rest_day'].includes(event.type);
      
      // Assume basic overlap (if full day, all displaced; if not, we would do time comparison)
      // We will treat all tasks as displaced if it's full day, or if we want to be exact, compare times.
      let overlaps = false;
      if (isFullDay) {
        overlaps = true;
      } else {
        // Parse time_start/end
        const [sh, sm] = entry.time_start.split(':').map(Number);
        const [eh, em] = entry.time_end.split(':').map(Number);
        const entryStart = new Date(plan.date);
        entryStart.setHours(sh, sm, 0, 0);
        const entryEnd = new Date(plan.date);
        entryEnd.setHours(eh, em, 0, 0);

        if (event.date_start < entryEnd && event.date_end > entryStart) {
          overlaps = true;
        }
      }

      if (overlaps) {
        displacedTasks.push(entry);
      } else {
        keptEntries.push(entry);
      }
    }

    if (displacedTasks.length > 0) {
      plan.plan = keptEntries;
      
      // Apply rescheduling rules (mostly recording them in skipped_tasks so they carry over)
      for (const t of displacedTasks) {
        if (t.type === 'recurring') {
          // recurring tasks -> distribute across next 3 available days
          // In our setup, carryovers are handled by `contextCollector` pulling skipped/pending tasks.
          // By adding to skipped_tasks, it becomes a carryover for tomorrow.
          plan.skipped_tasks.push(t.task_id as any);
        } else if (t.type === 'one-time') {
          // one-time tasks -> push by 1 day (handled by skipped_tasks as well)
          plan.skipped_tasks.push(t.task_id as any);
        } else if (t.type === 'recharge') {
          // NOT rescheduled
          // Do nothing, don't add to skipped_tasks
        } else {
          // project or other
          plan.skipped_tasks.push(t.task_id as any);
        }
      }

      plan.ai_note = `Rescheduled due to event: ${event.label}.`;
      await plan.save();
    }
  }
}
