import { generateContent } from './modelSelector';

export async function buildWeeklyPrompt(weekData: any): Promise<string | null> {
  const systemPrompt = `You are LifeOS AI, an intelligent productivity coach.
Analyze the user's past 7 days. Identify one key observation about their energy, task completion, or pillar balance, and provide exactly one actionable recommendation for next week.
Format your response exactly as:
Observation: [text]
Recommendation: [text]`;

  const userPrompt = `
Here is my week data:
${JSON.stringify(weekData, null, 2)}
`;

  try {
    const response = await generateContent(systemPrompt, userPrompt, 0.5);
    return response.trim();
  } catch (e) {
    console.error('[AI] Failed to generate weekly review', e);
    return null;
  }
}
