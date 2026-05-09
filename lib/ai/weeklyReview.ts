import { generateContent } from '@/lib/ai/modelSelector';
import { WeeklyData } from '@/lib/insights/weeklyAggregator';

export interface WeeklyReviewInsight {
  observation: string;
  recommendation: string;
}

export async function buildWeeklyReview(weekData: WeeklyData): Promise<WeeklyReviewInsight | null> {
  const systemPrompt = `You are LifeOS AI, a thoughtful productivity coach reviewing someone's past week.
Respond with exactly two short paragraphs on separate lines:
Line 1 — Observation: one specific insight about their energy, task completion, or pillar balance patterns.
Line 2 — Recommendation: one concrete, actionable suggestion for next week.
Do NOT use markdown, headers, or bullet points. Keep each paragraph under 50 words.`;

  const userPrompt = `
Week: ${weekData.weekStart} to ${weekData.weekEnd}
Completion rate: ${weekData.completionRate}%
Pillar balance — Money: ${weekData.pillarBalance.money.pct}%, Soul: ${weekData.pillarBalance.soul.pct}%, Curiosity: ${weekData.pillarBalance.curiosity.pct}%
Pillar streaks — Money: ${weekData.pillarStreaks.money}d, Soul: ${weekData.pillarStreaks.soul}d, Curiosity: ${weekData.pillarStreaks.curiosity}d
Energy trend: ${weekData.energyByDay.map(e => `${e.date}:${e.avg ?? 'N/A'}`).join(', ')}
Recharge compliance: ${weekData.rechargeCompliance}%
Neglected pillars: ${weekData.neglectedPillars.length ? weekData.neglectedPillars.join(', ') : 'None'}
`;

  try {
    const raw = await generateContent(systemPrompt, userPrompt, 0.7);
    const lines = raw.trim().split('\n').filter(l => l.trim());
    return {
      observation: lines[0]?.trim() ?? 'Keep it up this week!',
      recommendation: lines[1]?.trim() ?? 'Focus on balancing your pillars.',
    };
  } catch (e) {
    console.error('[AI] Weekly review generation failed:', e);
    return null;
  }
}
