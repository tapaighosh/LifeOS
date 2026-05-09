import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import { aggregateWeeklyData } from '@/lib/insights/weeklyAggregator';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await DailyPlan.deleteMany({});
  await DayLog.deleteMany({});
});

describe('Module 9 — Weekly Review & Insights', () => {
  describe('aggregateWeeklyData', () => {
    it('handles an empty week gracefully', async () => {
      const data = await aggregateWeeklyData('2026-05-10'); // A Sunday
      expect(data.totalTasksScheduled).toBe(0);
      expect(data.completionRate).toBe(0);
      expect(data.pillarBalance.money.pct).toBe(0);
      expect(data.pillarStreaks.soul).toBe(0);
      expect(data.rechargeCompliance).toBe(100);
      expect(data.neglectedPillars).toEqual([]);
    });

    it('calculates completion rate and pillar balance correctly', async () => {
      const weekStart = '2026-05-04'; // Monday
      const weekEnd = '2026-05-10'; // Sunday

      await DailyPlan.create({
        date: weekStart,
        source: 'rule-based',
        plan: [
          { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'Task 1', pillar: 'money', type: 'one-time', duration: 30, energy_cost: 'low', priority: 1, status: 'done', active: true, time_start: '09:00', time_end: '09:30' },
          { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'Task 2', pillar: 'soul', type: 'one-time', duration: 30, energy_cost: 'low', priority: 1, status: 'done', active: true, time_start: '09:30', time_end: '10:00' },
          { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'Task 3', pillar: 'curiosity', type: 'one-time', duration: 30, energy_cost: 'low', priority: 1, status: 'skipped', active: true, time_start: '10:00', time_end: '10:30' },
        ],
      });

      const data = await aggregateWeeklyData(weekStart);
      
      expect(data.totalTasksScheduled).toBe(3);
      expect(data.totalTasksDone).toBe(2);
      expect(data.completionRate).toBe(Math.round((2 / 3) * 100));

      // 2 tasks done total. 1 money, 1 soul.
      expect(data.pillarBalance.money.pct).toBe(50);
      expect(data.pillarBalance.soul.pct).toBe(50);
      expect(data.pillarBalance.curiosity.pct).toBe(0);
      
      // curiosity is neglected (< 15%)
      expect(data.neglectedPillars).toContain('curiosity');
      expect(data.neglectedPillars).not.toContain('money');
      expect(data.neglectedPillars).not.toContain('soul');
    });

    it('calculates streaks correctly (consecutive days backward from end of week)', async () => {
      // Mon, Tue, Wed, Thu, Fri, Sat, Sun
      // Mon (04), Tue (05), Wed (06), Thu (07), Fri (08), Sat (09), Sun (10)
      const weekStart = '2026-05-04';
      
      const createDay = async (d: string, done: boolean) => {
        await DailyPlan.create({
          date: d,
          source: 'rule-based',
          plan: [
            { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'T', pillar: 'money', type: 'one-time', duration: 30, energy_cost: 'low', priority: 1, status: done ? 'done' : 'skipped', active: true, time_start: '09:00', time_end: '09:30' },
          ],
        });
      };

      await createDay('2026-05-08', true); // Fri
      await createDay('2026-05-09', true); // Sat
      await createDay('2026-05-10', true); // Sun
      // Streak should be 3 for money.

      const data = await aggregateWeeklyData(weekStart);
      expect(data.pillarStreaks.money).toBe(3);
    });

    it('calculates recharge compliance', async () => {
      const weekStart = '2026-05-04';
      
      await DailyPlan.create({
        date: weekStart,
        source: 'rule-based',
        plan: [
          { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'R1', pillar: 'soul', type: 'recharge', duration: 30, energy_cost: 'low', priority: 1, status: 'done', active: true, time_start: '12:00', time_end: '12:30' },
          { _id: new mongoose.Types.ObjectId(), task_id: new mongoose.Types.ObjectId(), title: 'R2', pillar: 'soul', type: 'recharge', duration: 30, energy_cost: 'low', priority: 1, status: 'skipped', active: true, time_start: '15:00', time_end: '15:30' },
        ],
      });

      const data = await aggregateWeeklyData(weekStart);
      expect(data.rechargeScheduled).toBe(2);
      expect(data.rechargeDone).toBe(1);
      expect(data.rechargeCompliance).toBe(50);
    });

    it('averages energy trends', async () => {
      const weekStart = '2026-05-04';
      
      await DayLog.create({
        date: '2026-05-04',
        energy_rating: 4,
        reflection: 'Good',
        entries: [],
      });
      await DayLog.create({
        date: '2026-05-05',
        energy_rating: 2,
        reflection: 'Bad',
        entries: [],
      });

      const data = await aggregateWeeklyData(weekStart);
      const e04 = data.energyByDay.find(e => e.date === '2026-05-04');
      const e05 = data.energyByDay.find(e => e.date === '2026-05-05');
      const e06 = data.energyByDay.find(e => e.date === '2026-05-06');

      expect(e04?.avg).toBe(4);
      expect(e05?.avg).toBe(2);
      expect(e06?.avg).toBeNull();
    });
  });
});
