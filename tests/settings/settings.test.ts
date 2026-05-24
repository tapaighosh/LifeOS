import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserSettings from '@/models/UserSettings';
import { settingsUpdateSchema } from '@/lib/validators/settings';

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
  await UserSettings.deleteMany({});
});

describe('Module 3 — User Settings & Preferences', () => {
  describe('3.1 Models & DB', () => {
    it('creates default user settings successfully', async () => {
      const settings = await UserSettings.create({
        wake_time: '06:00',
        sleep_time: '22:00',
        leave_time: '08:30',
        return_time: '18:00',
        notification_morning: '06:15',
        notification_night: '21:30',
        timezone: 'Asia/Kolkata',
        pillar_balance_target: { money: 40, soul: 30, curiosity: 30 },
      });
      expect(settings._id).toBeDefined();
      expect(settings.wake_time).toBe('06:00');
      expect(settings.pillar_balance_target.money).toBe(40);
    });

    it('fails to create settings with invalid time format', async () => {
      await expect(
        UserSettings.create({
          wake_time: '25:00', // invalid HH:MM
        })
      ).rejects.toThrow();

      await expect(
        UserSettings.create({
          wake_time: '6:00', // missing leading zero
        })
      ).rejects.toThrow();
    });

    it('fails to create settings when pillar sum is not 100', async () => {
      await expect(
        UserSettings.create({
          pillar_balance_target: { money: 50, soul: 50, curiosity: 50 },
        })
      ).rejects.toThrow(/sum up exactly to 100/);
    });

    it('updates user settings successfully', async () => {
      const settings = await UserSettings.create({});
      
      const updated = await UserSettings.findByIdAndUpdate(
        settings._id,
        { $set: { timezone: 'Europe/London' } },
        { new: true }
      );
      
      expect(updated?.timezone).toBe('Europe/London');
    });
  });

  describe('3.2 Zod Validators', () => {
    it('validates correct settings update payload', () => {
      const result = settingsUpdateSchema.safeParse({
        wake_time: '07:30',
        timezone: 'UTC',
        pillar_balance_target: { money: 50, soul: 25, curiosity: 25 },
      });
      expect(result.success).toBe(true);
    });

    it('fails validation when time format is incorrect', () => {
      const result = settingsUpdateSchema.safeParse({
        wake_time: '24:00', // 24 is invalid, max 23
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.wake_time).toBeDefined();
      }
    });

    it('fails validation when pillar balances do not sum to 100', () => {
      const result = settingsUpdateSchema.safeParse({
        pillar_balance_target: { money: 30, soul: 30, curiosity: 30 }, // sums to 90
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sum to exactly 100');
      }
    });
  });
});
