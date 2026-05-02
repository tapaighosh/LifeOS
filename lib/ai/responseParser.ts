import { z } from 'zod';
import { generateContent } from './modelSelector';
import { buildMorningPrompt } from './promptBuilder';
import { PlanContext } from '@/lib/scheduler/contextCollector';

const aiPlanSchema = z.object({
  plan: z.array(z.object({
    task_id: z.string(),
    type: z.enum(['recurring', 'one-time', 'project', 'recharge']),
    title: z.string(),
    time_start: z.string(),
    time_end: z.string(),
    pillar: z.enum(['money', 'soul', 'curiosity']),
    energy_cost: z.enum(['low', 'medium', 'high'])
  })),
  skipped_tasks: z.array(z.string()),
  ai_note: z.string()
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
