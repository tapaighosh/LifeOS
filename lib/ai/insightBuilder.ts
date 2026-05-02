import { generateContent } from './modelSelector';
import { IDayLog } from '@/models/DayLog';

export async function buildNightInsight(dayLog: Partial<IDayLog>): Promise<string | null> {
  const systemPrompt = `You are LifeOS AI, an encouraging and reflective companion. 
The user is checking in at night. Review their day log and provide a very brief, 2-line reflection or piece of wisdom.
Keep it warm, insightful, and strictly 2 sentences maximum. Do not format with quotes or markdown.`;

  const userPrompt = `
Here is my day log:
Energy Rating (1-5): ${dayLog.energy_rating}
Tasks Status:
${JSON.stringify(dayLog.entries, null, 2)}
My reflection: ${dayLog.reflection || 'None'}
`;

  try {
    const response = await generateContent(systemPrompt, userPrompt, 0.7);
    return response.trim();
  } catch (e) {
    console.error('[AI] Failed to generate night insight', e);
    return null;
  }
}
