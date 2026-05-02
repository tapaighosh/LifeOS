import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import EventBlock from '@/models/EventBlock';
import Task from '@/models/Task';
import DailyPlan from '@/models/DailyPlan';
import { handleEventCreated } from '@/lib/events/rescheduleHandler';

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
  await EventBlock.deleteMany({});
  await Task.deleteMany({});
  await DailyPlan.deleteMany({});
});

describe('Module 6 — Event Blocks & Calendar', () => {
  it('creates an event successfully', async () => {
    const ev = await EventBlock.create({
      date_start: new Date('2026-05-10'),
      date_end: new Date('2026-05-10'),
      type: 'trek',
      label: 'Mountain Hike',
    });
    expect(ev._id).toBeDefined();
    expect(ev.type).toBe('trek');
  });

  it('auto-creates prep task for travel event', async () => {
    const ev = await EventBlock.create({
      date_start: new Date('2026-05-15'),
      date_end: new Date('2026-05-20'),
      type: 'travel',
      label: 'Tokyo Trip',
    });

    await handleEventCreated(ev);

    const prepTask = await Task.findOne({ title: /Tokyo Trip/ });
    expect(prepTask).toBeDefined();
    expect(prepTask?.type).toBe('one-time');
    expect(prepTask?.priority).toBe(5);

    // Ensure prep_task_added flag is set
    const updatedEv = await EventBlock.findById(ev._id);
    expect(updatedEv?.prep_task_added).toBe(true);
  });

  it('reschedules displaced tasks when spontaneous event is added', async () => {
    const task1 = await Task.create({ title: 'T1', type: 'recurring', duration: 30, energy_cost: 'low', pillar: 'money', priority: 3 });
    const task2 = await Task.create({ title: 'T2', type: 'one-time', duration: 30, energy_cost: 'low', pillar: 'money', priority: 3 });
    const recharge = await Task.create({ title: 'R', type: 'recharge', duration: 15, energy_cost: 'low', pillar: 'soul', priority: 1 });

    const planDate = '2026-05-10';
    
    // Create a plan for 2026-05-10
    await DailyPlan.create({
      date: planDate,
      locked: false,
      source: 'rule-based',
      plan: [
        { task_id: task1._id, type: 'recurring', title: 'T1', time_start: '09:00', time_end: '09:30', pillar: 'money', energy_cost: 'low', status: 'pending' },
        { task_id: task2._id, type: 'one-time', title: 'T2', time_start: '10:00', time_end: '10:30', pillar: 'money', energy_cost: 'low', status: 'pending' },
        { task_id: recharge._id, type: 'recharge', title: 'R', time_start: '11:00', time_end: '11:15', pillar: 'soul', energy_cost: 'low', status: 'pending' },
      ],
      skipped_tasks: [],
    });

    // Create full-day event on same day
    const ev = await EventBlock.create({
      date_start: new Date('2026-05-10T00:00:00'),
      date_end: new Date('2026-05-10T23:59:59'),
      type: 'rest_day',
      label: 'Sick Day',
    });

    await handleEventCreated(ev);

    const updatedPlan = await DailyPlan.findOne({ date: planDate });
    
    // Plan should be cleared out
    expect(updatedPlan?.plan).toHaveLength(0);
    
    // T1 and T2 should be in skipped_tasks, Recharge should NOT be.
    expect(updatedPlan?.skipped_tasks).toHaveLength(2);
    const skippedIds = updatedPlan?.skipped_tasks.map(id => id.toString());
    expect(skippedIds).toContain(task1._id.toString());
    expect(skippedIds).toContain(task2._id.toString());
    expect(skippedIds).not.toContain(recharge._id.toString());
  });
});
