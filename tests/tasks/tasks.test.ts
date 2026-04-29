/**
 * Module 1 — Task CRUD Tests
 *
 * Covers all Section 1 test cases from .ai-context/test_cases.md:
 *  1.1 Create Task — required fields, invalid enums, recharge duration limit
 *  1.2 Read Tasks — list active, filter by pillar/type, empty list
 *  1.3 Update Task — update fields, non-existent task
 *  1.4 Delete Task — soft delete, hidden from list, kept in DB
 *
 * Uses mongodb-memory-server for isolated, in-process DB.
 * No real MongoDB connection needed.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Task from '@/models/Task';
import { taskCreateSchema, taskUpdateSchema } from '@/lib/validators/task';

// ─── Test Setup ───────────────────────────────────────────────────────────────

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
  // Clean up between tests
  await Task.deleteMany({});
});

// ─── Test Factories ───────────────────────────────────────────────────────────

const makeTask = (overrides: Partial<Parameters<typeof Task.create>[0]> = {}) => ({
  title: 'DSA Practice',
  pillar: 'money' as const,
  category: 'Interviews',
  type: 'recurring' as const,
  duration: 60,
  energy_cost: 'high' as const,
  slot_preference: 'morning' as const,
  frequency: 'daily' as const,
  revision: false,
  priority: 4,
  active: true,
  ...overrides,
});

// ─── Section 1.1: Create Task ─────────────────────────────────────────────────

describe('1.1 — Create Task', () => {
  it('creates a task with all required fields → success', async () => {
    const task = await Task.create(makeTask());
    expect(task._id).toBeDefined();
    expect(task.title).toBe('DSA Practice');
    expect(task.pillar).toBe('money');
    expect(task.active).toBe(true);
  });

  it('fails without required field: title → ValidationError', async () => {
    await expect(Task.create(makeTask({ title: '' }))).rejects.toThrow();
  });

  it('fails with invalid pillar value → ValidationError', async () => {
    await expect(
      Task.create(makeTask({ pillar: 'invalid' as 'money' }))
    ).rejects.toThrow();
  });

  it('fails with invalid duration (25 min is not in allowed set) → ValidationError', async () => {
    await expect(
      Task.create(makeTask({ duration: 25 as 60 }))
    ).rejects.toThrow();
  });

  it('fails with invalid energy_cost → ValidationError', async () => {
    await expect(
      Task.create(makeTask({ energy_cost: 'extreme' as 'high' }))
    ).rejects.toThrow();
  });

  it('fails when recharge task has duration > 15 → ValidationError', async () => {
    await expect(
      Task.create(makeTask({ type: 'recharge', duration: 30 }))
    ).rejects.toThrow('Recharge tasks must have a duration of 15 minutes or less');
  });

  it('creates recharge task with duration = 15 → success', async () => {
    const task = await Task.create(makeTask({ type: 'recharge', duration: 15 }));
    expect(task.type).toBe('recharge');
    expect(task.duration).toBe(15);
  });

  it('defaults active=true, priority=3, revision=false when not provided', async () => {
    const { active, priority, revision, ...base } = makeTask();
    const task = await Task.create(base);
    expect(task.active).toBe(true);
    expect(task.priority).toBe(3);
    expect(task.revision).toBe(false);
  });
});

// ─── Section 1.2: Read Tasks ──────────────────────────────────────────────────

describe('1.2 — Read Tasks', () => {
  beforeEach(async () => {
    await Task.create([
      makeTask({ title: 'Money Task 1', pillar: 'money', type: 'recurring' }),
      makeTask({ title: 'Soul Task 1', pillar: 'soul', type: 'recurring' }),
      makeTask({ title: 'Curiosity Task 1', pillar: 'curiosity', type: 'one-time' }),
      makeTask({ title: 'Inactive Task', active: false }),
    ]);
  });

  it('list all active tasks → returns only active=true', async () => {
    const tasks = await Task.find({ active: true }).lean();
    expect(tasks).toHaveLength(3);
    expect(tasks.every((t) => t.active === true)).toBe(true);
  });

  it('list tasks filtered by pillar=soul → returns only soul tasks', async () => {
    const tasks = await Task.find({ active: true, pillar: 'soul' }).lean();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Soul Task 1');
  });

  it('list tasks filtered by type=one-time → correct filter', async () => {
    const tasks = await Task.find({ active: true, type: 'one-time' }).lean();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Curiosity Task 1');
  });

  it('empty task list → returns empty array, not error', async () => {
    await Task.deleteMany({});
    const tasks = await Task.find({ active: true }).lean();
    expect(tasks).toEqual([]);
  });
});

// ─── Section 1.3: Update Task ─────────────────────────────────────────────────

describe('1.3 — Update Task', () => {
  it('updates task title → success', async () => {
    const task = await Task.create(makeTask());
    const updated = await Task.findByIdAndUpdate(
      task._id,
      { $set: { title: 'Updated Title' } },
      { new: true }
    );
    expect(updated?.title).toBe('Updated Title');
  });

  it('updates task pillar → success', async () => {
    const task = await Task.create(makeTask());
    const updated = await Task.findByIdAndUpdate(
      task._id,
      { $set: { pillar: 'curiosity' } },
      { new: true }
    );
    expect(updated?.pillar).toBe('curiosity');
  });

  it('updating non-existent task → returns null', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const result = await Task.findByIdAndUpdate(fakeId, { $set: { title: 'x' } }, { new: true });
    expect(result).toBeNull();
  });

  it('marks task as inactive (soft delete via update) → success', async () => {
    const task = await Task.create(makeTask());
    await Task.findByIdAndUpdate(task._id, { $set: { active: false } });
    const found = await Task.findById(task._id).lean();
    expect(found?.active).toBe(false);
  });
});

// ─── Section 1.4: Delete Task ─────────────────────────────────────────────────

describe('1.4 — Delete Task (soft delete)', () => {
  it('soft delete sets active=false', async () => {
    const task = await Task.create(makeTask());
    await Task.findByIdAndUpdate(task._id, { $set: { active: false } });
    const found = await Task.findById(task._id).lean();
    expect(found?.active).toBe(false);
  });

  it('deleted task is hidden from active list', async () => {
    const task = await Task.create(makeTask());
    await Task.findByIdAndUpdate(task._id, { $set: { active: false } });
    const activeTasks = await Task.find({ active: true }).lean();
    const ids = activeTasks.map((t) => String(t._id));
    expect(ids).not.toContain(String(task._id));
  });

  it('deleted task is kept in database (preserved for history)', async () => {
    const task = await Task.create(makeTask());
    await Task.findByIdAndUpdate(task._id, { $set: { active: false } });
    const allTasks = await Task.find({}).lean();
    const ids = allTasks.map((t) => String(t._id));
    expect(ids).toContain(String(task._id));
  });
});

// ─── Zod Validator Tests ──────────────────────────────────────────────────────

describe('Zod — taskCreateSchema validation', () => {
  const validPayload = {
    title: 'Test Task',
    pillar: 'money',
    type: 'recurring',
    duration: 60,
    energy_cost: 'high',
  };

  it('validates a complete valid payload → success', () => {
    const result = taskCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects missing title → error on title field', () => {
    const result = taskCreateSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('rejects invalid pillar → error on pillar field', () => {
    const result = taskCreateSchema.safeParse({ ...validPayload, pillar: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.pillar).toBeDefined();
    }
  });

  it('rejects duration 25 (not in allowed set) → error on duration field', () => {
    const result = taskCreateSchema.safeParse({ ...validPayload, duration: 25 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.duration).toBeDefined();
    }
  });

  it('rejects recharge task with duration > 15 → error on duration field', () => {
    const result = taskCreateSchema.safeParse({
      ...validPayload,
      type: 'recharge',
      duration: 30,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.duration).toBeDefined();
      expect(errors.duration![0]).toContain('15');
    }
  });

  it('accepts recharge task with duration = 15 → success', () => {
    const result = taskCreateSchema.safeParse({
      ...validPayload,
      type: 'recharge',
      duration: 15,
    });
    expect(result.success).toBe(true);
  });

  it('rejects priority > 5 → error on priority field', () => {
    const result = taskCreateSchema.safeParse({ ...validPayload, priority: 6 });
    expect(result.success).toBe(false);
  });
});

describe('Zod — taskUpdateSchema validation', () => {
  it('accepts empty object (all fields optional) → success', () => {
    const result = taskUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only title → success', () => {
    const result = taskUpdateSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('rejects recharge+duration>15 in partial update → error', () => {
    const result = taskUpdateSchema.safeParse({ type: 'recharge', duration: 60 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.duration).toBeDefined();
    }
  });
});
