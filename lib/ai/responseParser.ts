import { z } from 'zod';
import { generateContent } from './modelSelector';
import { buildMorningPrompt } from './promptBuilder';
import { PlanContext } from '@/lib/scheduler/contextCollector';

// ─── Shared field enums ────────────────────────────────────────────────────
const HHMMRegex = /^\d{2}:\d{2}$/;
const pillarEnum = z.enum(['money', 'soul', 'curiosity']);
const energyEnum = z.enum(['low', 'medium', 'high']);

// ─── Task entry schema (entry_type: 'task') ────────────────────────────────
// Used for real tasks from the tasks collection.
const aiTaskEntrySchema = z.object({
  entry_type: z.literal('task'),
  task_id: z.string().min(1, 'task_id is required for task entries'),
  type: z.enum(['recurring', 'one-time', 'project', 'recharge']),
  title: z.string().min(1),
  time_start: z.string().regex(HHMMRegex, 'time_start must be HH:MM format'),
  time_end: z.string().regex(HHMMRegex, 'time_end must be HH:MM format'),
  pillar: pillarEnum,
  energy_cost: energyEnum,
}).refine((d) => d.time_end > d.time_start, {
  message: 'time_end must be after time_start',
  path: ['time_end'],
});

// ─── Queue topic entry schema (entry_type: 'queue_topic') ──────────────────
// Used for learning queue items. Has topic_item_id instead of task_id.
const aiQueueTopicEntrySchema = z.object({
  entry_type: z.literal('queue_topic'),
  topic_item_id: z.string().min(1, 'topic_item_id is required for queue_topic entries'),
  title: z.string().min(1),
  time_start: z.string().regex(HHMMRegex, 'time_start must be HH:MM format'),
  time_end: z.string().regex(HHMMRegex, 'time_end must be HH:MM format'),
  pillar: pillarEnum,
  energy_cost: energyEnum,
}).refine((d) => d.time_end > d.time_start, {
  message: 'time_end must be after time_start',
  path: ['time_end'],
});

// ─── Discriminated union: entry_type selects which schema to apply ─────────
const aiPlanEntrySchema = z.discriminatedUnion('entry_type', [
  aiTaskEntrySchema,
  aiQueueTopicEntrySchema,
]);

const aiPlanSchema = z.object({
  plan: z.array(aiPlanEntrySchema),
  skipped_tasks: z.array(z.string()),
  ai_note: z.string(),
});

export type AIPlanResponse = z.infer<typeof aiPlanSchema>;

function extractJSON(text: string): any {
  // Try to find anything looking like a JSON object/array
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

export async function generateAndParsePlan(context: PlanContext): Promise<AIPlanResponse | null> {
  const { systemPrompt, userPrompt } = buildMorningPrompt(context);
  
  try {
    const responseText = await generateContent(systemPrompt, userPrompt, 0.3);
    const parsed = extractJSON(responseText);
    const validated = aiPlanSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.warn('[AI] First attempt failed or invalid JSON. Retrying...', error);
    
    try {
      // Retry with stricter instructions
      const strictSystem = systemPrompt + '\n\nWARNING: Your previous response was invalid. Return ONLY pure valid JSON.';
      const retryText = await generateContent(strictSystem, userPrompt, 0.1);
      const parsed = extractJSON(retryText);
      return aiPlanSchema.parse(parsed);
    } catch (retryError) {
      console.error('[AI] Retry failed. Falling back to rule-based scheduler.', retryError);
      return null;
    }
  }
}
