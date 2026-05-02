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

Rules:
1. Do NOT exceed the duration of available slots.
2. If energy history is low (average < 3), prefer 'low' energy_cost tasks and include a recharge break.
3. If a pillar is neglected (<15%), prioritize tasks of that pillar.
4. Always schedule a recharge break around midday if total slots > 3 hours.
5. Provide a short, encouraging 'ai_note' explaining your reasoning.

Output Format (Strict JSON):
{
  "plan": [
    { "task_id": "id_from_above", "type": "recurring|one-time|project|recharge", "title": "...", "time_start": "HH:MM", "time_end": "HH:MM", "pillar": "...", "energy_cost": "..." }
  ],
  "skipped_tasks": ["id_from_above"],
  "ai_note": "A short sentence."
}`;

  return { systemPrompt, userPrompt };
}
