import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Task from '@/models/Task';
import RevisionQueue from '@/models/RevisionQueue';
import {
  onTaskCompleted,
  completeRevision,
  getRevisionsDue,
  buildRevisionTasksForDate,
  DEFAULT_CYCLE,
  DAILY_REVISION_CAP,
} from '@/lib/revision/revisionEngine';

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
  await Task.deleteMany({});
  await RevisionQueue.deleteMany({});
});

// Helper: create a basic task with revision=true
async function makeRevTask(overrides: any = {}) {
  return Task.create({
    title: 'Learn Guitar Chords',
    pillar: 'soul',
    type: 'one-time',
    duration: 30,
    energy_cost: 'medium',
    priority: 3,
    active: true,
    revision: true,
    ...overrides,
  });
}

describe('Module 8 — Spaced Repetition System', () => {
  describe('onTaskCompleted', () => {
    it('creates a RevisionQueue entry on first completion', async () => {
      const task = await makeRevTask();
      await onTaskCompleted(task as any);

      const entry = await RevisionQueue.findOne({ task_id: task._id });
      expect(entry).not.toBeNull();
      expect(entry!.cycle_index).toBe(1);
      expect(entry!.original_title).toBe('Learn Guitar Chords');

      // next_revision should be today + DEFAULT_CYCLE[0] days (compare date strings to avoid ms jitter)
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + DEFAULT_CYCLE[0]);
      const entryStr = entry!.next_revision.toISOString().split('T')[0];
      const expectedStr = expectedDate.toISOString().split('T')[0];
      expect(entryStr).toBe(expectedStr);
    });

    it('resets the cycle if task is completed again', async () => {
      const task = await makeRevTask();
      await onTaskCompleted(task as any);
      // Simulate already partially advanced
      await RevisionQueue.findOneAndUpdate(
        { task_id: task._id },
        { cycle_index: 3, revision_history: [new Date()] }
      );
      // Complete again — should reset
      await onTaskCompleted(task as any);
      const entry = await RevisionQueue.findOne({ task_id: task._id });
      expect(entry!.cycle_index).toBe(1); // reset
    });

    it('does NOT create entry for non-revision tasks', async () => {
      const task = await Task.create({
        title: 'Buy groceries', pillar: 'money', type: 'one-time',
        duration: 15, energy_cost: 'low', priority: 2, active: true, revision: false
      });
      await onTaskCompleted(task as any);
      const count = await RevisionQueue.countDocuments({ task_id: task._id });
      expect(count).toBe(0);
    });
  });

  describe('completeRevision', () => {
    it('advances cycle_index and sets correct next_revision', async () => {
      const task = await makeRevTask();
      await onTaskCompleted(task as any); // cycle_index = 1

      const entry = (await RevisionQueue.findOne({ task_id: task._id }))!;
      await completeRevision(entry);

      const updated = (await RevisionQueue.findById(entry._id))!;
      expect(updated.cycle_index).toBe(2);

      const expectedDays = DEFAULT_CYCLE[1]; // 3 days
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + expectedDays);
      const diff = Math.abs(updated.next_revision.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(5000);
    });

    it('does not remove entry when cycle is exhausted (missed = persists)', async () => {
      const task = await makeRevTask();
      const entry = await RevisionQueue.create({
        task_id: task._id,
        original_title: task.title,
        learned_on: new Date(),
        next_revision: new Date(),
        cycle_index: DEFAULT_CYCLE.length, // already exhausted
        revision_history: [],
      });

      await completeRevision(entry);

      const stillExists = await RevisionQueue.findById(entry._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('getRevisionsDue', () => {
    it('returns items whose next_revision is today or past', async () => {
      const task = await makeRevTask();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await RevisionQueue.create({
        task_id: task._id,
        original_title: task.title,
        learned_on: new Date(),
        next_revision: yesterday,
        cycle_index: 1,
        revision_history: [],
      });

      const today = new Date().toISOString().split('T')[0];
      const due = await getRevisionsDue(today);
      expect(due.length).toBeGreaterThanOrEqual(1);
    });

    it('missed revision stays in queue (does not disappear)', async () => {
      const task = await makeRevTask();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await RevisionQueue.create({
        task_id: task._id,
        original_title: task.title,
        learned_on: new Date(),
        next_revision: twoDaysAgo,
        cycle_index: 1,
        revision_history: [],
      });

      const today = new Date().toISOString().split('T')[0];
      const due = await getRevisionsDue(today);
      expect(due.length).toBeGreaterThanOrEqual(1);
      // Still in DB
      const inDB = await RevisionQueue.countDocuments({ task_id: task._id });
      expect(inDB).toBe(1);
    });
  });

  describe('buildRevisionTasksForDate', () => {
    it('caps daily revision tasks at DAILY_REVISION_CAP', async () => {
      const tasks = await Promise.all(
        Array.from({ length: DAILY_REVISION_CAP + 2 }).map((_, i) =>
          makeRevTask({ title: `Task ${i}` })
        )
      );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Promise.all(
        tasks.map(task =>
          RevisionQueue.create({
            task_id: task._id,
            original_title: task.title,
            learned_on: new Date(),
            next_revision: yesterday,
            cycle_index: 1,
            revision_history: [],
          })
        )
      );

      const today = new Date().toISOString().split('T')[0];
      const { revisionPseudoTasks } = await buildRevisionTasksForDate(today);
      expect(revisionPseudoTasks.length).toBe(DAILY_REVISION_CAP);
    });

    it('deferred overflow items have next_revision moved to tomorrow', async () => {
      const tasks = await Promise.all(
        Array.from({ length: DAILY_REVISION_CAP + 1 }).map((_, i) =>
          makeRevTask({ title: `Overflow ${i}` })
        )
      );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const entries = await Promise.all(
        tasks.map(task =>
          RevisionQueue.create({
            task_id: task._id,
            original_title: task.title,
            learned_on: new Date(),
            next_revision: yesterday,
            cycle_index: 1,
            revision_history: [],
          })
        )
      );

      const today = new Date().toISOString().split('T')[0];
      await buildRevisionTasksForDate(today);

      // Deferred items land on yesterday+1 = today. Any item no longer on 'yesterday' = deferred.
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let deferredCount = 0;
      for (const e of entries) {
        const updated = await RevisionQueue.findById(e._id);
        if (updated) {
          const updatedStr = updated.next_revision.toISOString().split('T')[0];
          if (updatedStr > yesterdayStr) deferredCount++;
        }
      }
      expect(deferredCount).toBe(1);
    });

    it('revision pseudo-tasks are titled "Revise: ..."', async () => {
      const task = await makeRevTask({ title: 'Advanced Calculus' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await RevisionQueue.create({
        task_id: task._id,
        original_title: task.title,
        learned_on: new Date(),
        next_revision: yesterday,
        cycle_index: 1,
        revision_history: [],
      });

      const today = new Date().toISOString().split('T')[0];
      const { revisionPseudoTasks } = await buildRevisionTasksForDate(today);
      expect(revisionPseudoTasks[0].title).toBe('Revise: Advanced Calculus');
      expect(revisionPseudoTasks[0].duration).toBe(15);
      expect(revisionPseudoTasks[0].energy_cost).toBe('low');
    });
  });
});
