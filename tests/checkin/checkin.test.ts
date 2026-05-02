import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import DayLog from '@/models/DayLog';
import DailyPlan from '@/models/DailyPlan';
import Task from '@/models/Task';
import RevisionQueue from '@/models/RevisionQueue';
import { dayLogCheckinSchema } from '@/lib/validators/dayLog';

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
  await DayLog.deleteMany({});
  await DailyPlan.deleteMany({});
  await Task.deleteMany({});
  await RevisionQueue.deleteMany({});
});

describe('Module 5 — Night Check-In Flow', () => {
  describe('Zod Validation', () => {
    it('validates a complete valid check-in', () => {
      const payload = {
        date: '2026-05-02',
        entries: [
          { task_id: new mongoose.Types.ObjectId().toString(), status: 'done' },
          { task_id: new mongoose.Types.ObjectId().toString(), status: 'partial', completion_pct: 50 },
          { task_id: new mongoose.Types.ObjectId().toString(), status: 'skipped', skip_reason: 'tired' }
        ],
        energy_rating: 4,
        reflection: 'Good day overall.'
      };
      
      const result = dayLogCheckinSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('fails if energy_rating is missing', () => {
      const payload = {
        date: '2026-05-02',
        entries: [],
      };
      const result = dayLogCheckinSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.energy_rating).toBeDefined();
      }
    });

    it('fails if energy_rating is out of bounds', () => {
      const payload = {
        date: '2026-05-02',
        entries: [],
        energy_rating: 6
      };
      const result = dayLogCheckinSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('fails if reflection is over 200 chars', () => {
      const payload = {
        date: '2026-05-02',
        entries: [],
        energy_rating: 3,
        reflection: 'a'.repeat(201)
      };
      const result = dayLogCheckinSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('DB / Schema logic', () => {
    it('saves a DayLog properly', async () => {
      const taskId1 = new mongoose.Types.ObjectId();
      const taskId2 = new mongoose.Types.ObjectId();
      
      const log = await DayLog.create({
        date: '2026-05-02',
        energy_rating: 4,
        entries: [
          { task_id: taskId1, status: 'done' },
          { task_id: taskId2, status: 'skipped', skip_reason: 'no time' }
        ]
      });

      expect(log._id).toBeDefined();
      expect(log.entries).toHaveLength(2);
      expect(log.entries[1].skip_reason).toBe('no time');
    });
  });
});
