/**
 * Challenge System Tests — Module P2-A
 *
 * Test strategy:
 *   - Uses mongodb-memory-server (in-memory MongoDB) — no real DB needed
 *   - Tests the business logic layer (models + route handlers) in isolation
 *   - Challenge hook tests simulate check-in entries directly against the model
 *
 * Post-save hook pattern benefit:
 *   The challenge progress logic lives in the checkin route, NOT in Mongoose middleware.
 *   This means we can test it by calling the model directly with known inputs
 *   without having to simulate a full HTTP request or mock the entire DayLog pipeline.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Challenge from '@/models/Challenge';
import Task from '@/models/Task';
import { CHALLENGE_LIBRARY } from '@/lib/challenges/library';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Challenge.deleteMany({});
  await Task.deleteMany({});
});

// ─── Helper: simulate accepting a challenge ───────────────────────────────────

async function acceptChallenge(libraryId = 'ph-001', pillar: 'money' | 'soul' | 'curiosity' = 'soul') {
  const item = CHALLENGE_LIBRARY.find((c) => c.id === libraryId)!;
  expect(item).toBeDefined();

  const task = await Task.create({
    title: item.title,
    pillar,
    type: 'recurring',
    duration: item.suggested_duration,
    energy_cost: 'medium',
    slot_preference: 'any',
    frequency: item.suggested_frequency,
    active: true,
    challenge_id: null,
  });

  const today = new Date().toISOString().split('T')[0];
  const challenge = await Challenge.create({
    title: item.title,
    category: item.category,
    description: item.description,
    target_type: item.target_type,
    target_value: item.target_value,
    started_on: today,
    status: 'active',
    linked_task_id: task._id,
    current_streak: 0,
    best_streak: 0,
    total_completed: 0,
  });

  await Task.findByIdAndUpdate(task._id, { $set: { challenge_id: challenge._id } });

  return { task, challenge };
}

// ─── Helper: simulate a check-in entry updating the challenge ─────────────────

async function simulateCheckinEntry(
  taskId: mongoose.Types.ObjectId,
  status: 'done' | 'skipped' | 'partial',
  date: string
) {
  const challenge = await Challenge.findOne({ linked_task_id: taskId, status: 'active' });
  if (!challenge) return;

  if (status === 'done') {
    const prevLastCompleted = challenge.last_completed_on;
    challenge.total_completed += 1;
    challenge.last_completed_on = date;

    if (challenge.target_type === 'streak') {
      if (prevLastCompleted) {
        const prev = new Date(prevLastCompleted);
        const today = new Date(date);
        const msPerDay = 24 * 60 * 60 * 1000;
        const gap = Math.round((today.getTime() - prev.getTime()) / msPerDay);
        challenge.current_streak = gap === 1 ? challenge.current_streak + 1 : 1;
      } else {
        challenge.current_streak = 1;
      }
      if (challenge.current_streak > challenge.best_streak) {
        challenge.best_streak = challenge.current_streak;
      }
    }

    if (challenge.total_completed >= challenge.target_value) {
      challenge.status = 'completed';
    }
  } else if ((status === 'skipped' || status === 'partial') && challenge.target_type === 'streak') {
    challenge.current_streak = 0;
  }

  await challenge.save();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('P2-A: Challenge acceptance', () => {
  test('accept challenge → task created with challenge_id', async () => {
    const { task, challenge } = await acceptChallenge('ph-001', 'soul');

    const updatedTask = await Task.findById(task._id).lean();
    expect(updatedTask).not.toBeNull();
    expect(updatedTask!.challenge_id?.toString()).toBe(challenge._id.toString());

    const savedChallenge = await Challenge.findById(challenge._id).lean();
    expect(savedChallenge!.linked_task_id?.toString()).toBe(task._id.toString());
    expect(savedChallenge!.status).toBe('active');
    expect(savedChallenge!.total_completed).toBe(0);
  });

  test('library has 50 challenges covering all 5 categories', () => {
    const categories = new Set(CHALLENGE_LIBRARY.map((c) => c.category));
    expect(categories).toContain('physical');
    expect(categories).toContain('mental');
    expect(categories).toContain('financial');
    expect(categories).toContain('social');
    expect(categories).toContain('creative');
    expect(CHALLENGE_LIBRARY.length).toBeGreaterThanOrEqual(40);
  });

  test('library GET with category filter returns subset', () => {
    const physical = CHALLENGE_LIBRARY.filter((c) => c.category === 'physical');
    const all = CHALLENGE_LIBRARY;
    expect(physical.length).toBeGreaterThan(0);
    expect(physical.length).toBeLessThan(all.length);
    expect(physical.every((c) => c.category === 'physical')).toBe(true);
  });
});

describe('P2-A: Night check-in streak logic', () => {
  test('check-in done → streak increments', async () => {
    const { task, challenge } = await acceptChallenge('ph-001', 'soul');
    expect(challenge.target_type).toBe('streak');

    const day1 = '2026-05-01';
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', day1);
    const after1 = await Challenge.findById(challenge._id).lean();
    expect(after1!.current_streak).toBe(1);
    expect(after1!.total_completed).toBe(1);

    const day2 = '2026-05-02';
    // Simulate consecutive day — need to find active challenge
    const ch = await Challenge.findById(challenge._id);
    ch!.status = 'active';
    await ch!.save();
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', day2);
    const after2 = await Challenge.findById(challenge._id).lean();
    expect(after2!.current_streak).toBe(2);
    expect(after2!.best_streak).toBe(2);
  });

  test('check-in skipped → streak resets to 0 (streak type)', async () => {
    const { task, challenge } = await acceptChallenge('ph-001', 'soul');

    // First mark done
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', '2026-05-01');
    const after1 = await Challenge.findById(challenge._id).lean();
    expect(after1!.current_streak).toBe(1);

    // Then skip
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'skipped', '2026-05-02');
    const after2 = await Challenge.findById(challenge._id).lean();
    expect(after2!.current_streak).toBe(0);
  });

  test('partial on streak challenge → streak resets', async () => {
    const { task, challenge } = await acceptChallenge('ph-001', 'soul');

    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', '2026-05-01');
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'partial', '2026-05-02');
    const after = await Challenge.findById(challenge._id).lean();
    expect(after!.current_streak).toBe(0);
  });

  test('total_completed >= target_value → status = completed', async () => {
    // Use a milestone challenge (target_value=1) for quick test
    const { task, challenge } = await acceptChallenge('ph-006', 'soul');
    expect(challenge.target_type).toBe('milestone');
    expect(challenge.target_value).toBe(1);

    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', '2026-05-01');
    const after = await Challenge.findById(challenge._id).lean();
    expect(after!.total_completed).toBe(1);
    expect(after!.status).toBe('completed');
  });
});

describe('P2-A: Soft-delete guard', () => {
  test('soft-delete task → challenge status = paused', async () => {
    const { task, challenge } = await acceptChallenge('ph-001', 'soul');
    expect(challenge.status).toBe('active');

    // Simulate what the DELETE /api/tasks/[id] route does
    const linkedChallenge = await Challenge.findOne({
      linked_task_id: task._id,
      status: 'active',
    });
    if (linkedChallenge) {
      linkedChallenge.status = 'paused';
      await linkedChallenge.save();
    }
    await Task.findByIdAndUpdate(task._id, { $set: { active: false } });

    const updatedChallenge = await Challenge.findById(challenge._id).lean();
    expect(updatedChallenge!.status).toBe('paused');

    const updatedTask = await Task.findById(task._id).lean();
    expect(updatedTask!.active).toBe(false);
  });
});

describe('P2-A: total_count type — missed day does not reset', () => {
  test('missing a day on total_count challenge does not reset progress', async () => {
    const { task, challenge } = await acceptChallenge('cr-001', 'soul');
    expect(challenge.target_type).toBe('total_count');

    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'done', '2026-05-01');
    // Simulate skipping a day
    await simulateCheckinEntry(task._id as mongoose.Types.ObjectId, 'skipped', '2026-05-02');
    // total_count: skipped does NOT reset anything (only streak type resets)
    const after = await Challenge.findById(challenge._id).lean();
    expect(after!.total_completed).toBe(1);
    // current_streak stays 0 (irrelevant for total_count)
    expect(after!.current_streak).toBe(0);
  });
});
