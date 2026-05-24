import { generateAndParsePlan } from '@/lib/ai/responseParser';
import { buildNightInsight } from '@/lib/ai/insightBuilder';
import { generateContent } from '@/lib/ai/modelSelector';
import mongoose from 'mongoose';

// Mock modelSelector
jest.mock('@/lib/ai/modelSelector', () => ({
  generateContent: jest.fn()
}));

describe('Module 7 — AI Integration (Claude + Gemini)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid JSON response successfully', async () => {
    const mockContext: any = {
      date: '2026-05-15',
      slots: [],
      pendingTasks: [],
      pillarBalance: { money: 33, soul: 33, curiosity: 33 },
      energyHistory: [4, 4, 3],
      rechargeMenu: []
    };

    const validJSON = JSON.stringify({
      plan: [
        {
          task_id: new mongoose.Types.ObjectId().toString(),
          type: 'one-time',
          title: 'Do homework',
          time_start: '09:00',
          time_end: '10:00',
          pillar: 'money',
          energy_cost: 'medium'
        }
      ],
      skipped_tasks: [],
      ai_note: 'A good solid plan.'
    });

    (generateContent as jest.Mock).mockResolvedValue(validJSON);

    const result = await generateAndParsePlan(mockContext);
    
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.plan[0].title).toBe('Do homework');
  });

  it('retries when JSON is malformed and falls back if still failing', async () => {
    const mockContext: any = {
      date: '2026-05-15',
      slots: [],
      pendingTasks: [],
      pillarBalance: { money: 33, soul: 33, curiosity: 33 },
      energyHistory: [4, 4, 3],
      rechargeMenu: []
    };

    // First attempt fails, second attempt fails
    (generateContent as jest.Mock)
      .mockResolvedValueOnce('I cannot do this because I am an AI.') // invalid JSON
      .mockRejectedValueOnce(new Error('Retry failed'));

    const result = await generateAndParsePlan(mockContext);

    expect(generateContent).toHaveBeenCalledTimes(2); // Initial + Retry
    expect(result).toBeNull(); // Fell back to rule-based
  });

  it('generates a night insight successfully', async () => {
    const log = {
      energy_rating: 4,
      entries: [],
      reflection: 'It was a long day.'
    };

    (generateContent as jest.Mock).mockResolvedValue('Rest well. Tomorrow is a new start.');

    const insight = await buildNightInsight(log as any);
    expect(insight).toBe('Rest well. Tomorrow is a new start.');
  });
});
