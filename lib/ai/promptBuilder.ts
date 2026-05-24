import { PlanContext } from '@/lib/scheduler/contextCollector';

export function buildMorningPrompt(context: PlanContext) {
  const systemPrompt = `You are LifeOS AI, an intelligent personal scheduler.
Your objective is to generate an optimal DailyPlan based on the user's available time slots, carryover tasks, priorities, energy levels, and pillar balance.
You MUST output strictly valid JSON conforming exactly to the user's request. No markdown code blocks like \`\`\`json, just the raw JSON text.`;

const userPrompt = `
Date: ${context.date}
Available Time Slots:
${JSON.stringify(context.slots, null, 2)}

Weekly Pillar Balance (lower means neglected):
${JSON.stringify(context.pillarBalance, null, 2)}

Energy History (last 7 days, 1=low, 5=high):
${JSON.stringify(context.energyHistory, null, 2)}

Recharge Menu:
${JSON.stringify(context.rechargeMenu, null, 2)}

Tasks to Schedule:
${JSON.stringify(context.pendingTasks.map(t => ({ id: t._id, title: t.title, duration: t.duration, energy_cost: t.energy_cost, priority: t.priority, type: t.type, pillar: t.pillar })), null, 2)}

Active Topic Queues (next items to surface if pillar is neglected):
${JSON.stringify(
  (context.queueCandidates ?? []).filter(q => q.nextItem).map(q => ({
    queue: q.queue_name,
    pillar: q.pillar,
    type: q.queue_type,
    next_item: q.nextItem?.title,
    topic_item_id: (q.nextItem as any)?._id?.toString(),
    suggested_duration_min: q.queue_type === 'dsa' ? 45 : 25,
  })),
  null, 2
)}

Rules:
1. Do NOT exceed the duration of available slots.
2. If energy history is low (average < 3), prefer 'low' energy_cost tasks and include a recharge break.
3. If a pillar is neglected (<15%), prioritize tasks of that pillar.
4. Always schedule a recharge break around midday if total slots > 3 hours.
5. Provide a short, encouraging 'ai_note' explaining your reasoning.
6. If a pillar is below 33%, include one topic from that queue's next item.
   Use entry_type "queue_topic", include topic_item_id (from the queue list above),
   and do NOT set task_id for these entries. Assign a morning time slot.
7. Ensure the difference between time_start and time_end EXACTLY matches the task's provided 'duration' in minutes. For queue_topic entries, use the 'suggested_duration_min'.

Output Format (Strict JSON):
{
  "plan": [
    { "task_id": "id_from_above", "entry_type": "task", "type": "recurring|one-time|project|recharge", "title": "...", "time_start": "HH:MM", "time_end": "HH:MM", "pillar": "...", "energy_cost": "...", "status": "pending" },
    { "topic_item_id": "id_from_queues", "entry_type": "queue_topic", "type": "one-time", "title": "Study: ...", "time_start": "HH:MM", "time_end": "HH:MM", "pillar": "...", "energy_cost": "low", "status": "pending" }
  ],
  "skipped_tasks": ["id_from_above"],
  "ai_note": "A short sentence."
}`;

  return { systemPrompt, userPrompt };
}
