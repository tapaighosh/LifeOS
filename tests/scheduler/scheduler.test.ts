import mongoose from 'mongoose';
import { calculateAvailableSlots } from '@/lib/scheduler/slotCalculator';
import { generatePlan } from '@/lib/scheduler/planGenerator';
import { IUserSettings } from '@/models/UserSettings';
import { IEventBlock } from '@/models/EventBlock';
import { ITask } from '@/models/Task';
import { IRechargeItem } from '@/models/RechargeItem';

describe('Module 4 — Daily Plan Generation', () => {
  describe('4.1 Slot Calculator', () => {
    it('calculates morning and evening slots correctly without events', () => {
      const settings = {
        wake_time: '06:00',
        leave_time: '08:30',
        return_time: '18:00',
        sleep_time: '22:00',
      } as IUserSettings;

      const slots = calculateAvailableSlots('2026-05-02', settings, []);
      
      expect(slots).toHaveLength(2);
      
      const morning = slots.find(s => s.period === 'morning');
      expect(morning?.duration).toBe(150); // 2.5 hours

      const evening = slots.find(s => s.period === 'evening');
      expect(evening?.duration).toBe(240); // 4 hours
    });

    it('subtracts overlapping event blocks from slots', () => {
      const settings = {
        wake_time: '06:00',
        leave_time: '09:00',
        return_time: '18:00',
        sleep_time: '22:00',
      } as IUserSettings;

      const events = [
        {
          date_start: new Date('2026-05-02T07:00:00'),
          date_end: new Date('2026-05-02T08:00:00'),
        }
      ] as IEventBlock[];

      const slots = calculateAvailableSlots('2026-05-02', settings, events);
      
      // Morning slot (06:00 - 09:00) gets split into two:
      // 06:00 - 07:00 (60 mins)
      // 08:00 - 09:00 (60 mins)
      const morningSlots = slots.filter(s => s.period === 'morning');
      expect(morningSlots).toHaveLength(2);
      expect(morningSlots[0].duration).toBe(60);
      expect(morningSlots[1].duration).toBe(60);
    });
  });

  describe('4.2 Plan Generator', () => {
    it('generates a plan and correctly schedules by priority and energy', () => {
      const slots = [
        { start: new Date('2026-05-02T06:00:00'), end: new Date('2026-05-02T08:00:00'), duration: 120, period: 'morning' as const }
      ];

      const tasks = [
        { _id: new mongoose.Types.ObjectId(), title: 'Low priority', priority: 1, energy_cost: 'low', duration: 30, pillar: 'money', type: 'recurring' },
        { _id: new mongoose.Types.ObjectId(), title: 'High priority High energy', priority: 5, energy_cost: 'high', duration: 30, pillar: 'money', type: 'recurring' },
        { _id: new mongoose.Types.ObjectId(), title: 'High priority Low energy', priority: 5, energy_cost: 'low', duration: 30, pillar: 'money', type: 'recurring' },
      ] as unknown as ITask[];

      const context: any = {
        targetDate: '2026-05-02',
        dayOfWeek: 6,
        availableSlots: slots,
        carryoverTasks: [],
        todayTasks: tasks,
        revisionTasks: [],
        rechargeMenu: [],
        energyRatings7d: [],
        pillarBalance7d: { money: 0, soul: 0, curiosity: 0 },
      };

      const planDoc = generatePlan(context);
      
      expect(planDoc.plan).toHaveLength(3);
      // In morning: High priority first, then energy DESC.
      // So 'High priority High energy' (priority 5, high energy) should be first
      expect(planDoc.plan[0].title).toBe('High priority High energy');
      // Then 'High priority Low energy' (priority 5, low energy)
      expect(planDoc.plan[1].title).toBe('High priority Low energy');
      // Then 'Low priority'
      expect(planDoc.plan[2].title).toBe('Low priority');
    });

    it('inserts a recharge block around the midpoint', () => {
      const slots = [
        { start: new Date('2026-05-02T06:00:00'), end: new Date('2026-05-02T08:00:00'), duration: 120, period: 'morning' as const }
      ];

      const tasks = [
        { _id: new mongoose.Types.ObjectId(), title: 'T1', priority: 3, energy_cost: 'low', duration: 60, pillar: 'money', type: 'recurring' },
        { _id: new mongoose.Types.ObjectId(), title: 'T2', priority: 3, energy_cost: 'low', duration: 45, pillar: 'money', type: 'recurring' },
      ] as unknown as ITask[];

      const recharges = [
        { _id: new mongoose.Types.ObjectId(), title: 'Nap', duration: 15, favourite: true }
      ] as unknown as IRechargeItem[];

      const context: any = {
        targetDate: '2026-05-02',
        dayOfWeek: 6,
        availableSlots: slots,
        carryoverTasks: [],
        todayTasks: tasks,
        revisionTasks: [],
        rechargeMenu: recharges,
        energyRatings7d: [],
        pillarBalance7d: { money: 0, soul: 0, curiosity: 0 },
      };

      const planDoc = generatePlan(context);
      
      // Total tasks duration = 105, recharge = 15. Total = 120. Fits exactly.
      expect(planDoc.plan).toHaveLength(3);
      
      // Find recharge block
      const rechargeBlock = planDoc.plan.find(p => p.type === 'recharge');
      expect(rechargeBlock).toBeDefined();
      expect(rechargeBlock?.title).toContain('Nap');
    });

    it('overflows tasks that do not fit into skipped_tasks', () => {
      const slots = [
        { start: new Date('2026-05-02T06:00:00'), end: new Date('2026-05-02T07:00:00'), duration: 60, period: 'morning' as const }
      ];

      const tasks = [
        { _id: new mongoose.Types.ObjectId(), title: 'Fits', priority: 5, energy_cost: 'low', duration: 60, pillar: 'money', type: 'recurring' },
        { _id: new mongoose.Types.ObjectId(), title: 'Does not fit', priority: 1, energy_cost: 'low', duration: 30, pillar: 'money', type: 'recurring' },
      ] as unknown as ITask[];

      const context: any = {
        targetDate: '2026-05-02',
        dayOfWeek: 6,
        availableSlots: slots,
        carryoverTasks: [],
        todayTasks: tasks,
        revisionTasks: [],
        rechargeMenu: [],
        energyRatings7d: [],
        pillarBalance7d: { money: 0, soul: 0, curiosity: 0 },
      };

      const planDoc = generatePlan(context);
      
      expect(planDoc.plan).toHaveLength(1);
      expect(planDoc.plan[0].title).toBe('Fits');
      
      expect(planDoc.skipped_tasks).toHaveLength(1);
    });
  });
});
