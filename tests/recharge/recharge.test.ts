import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import RechargeItem from '@/models/RechargeItem';
import { rechargeCreateSchema, rechargeUpdateSchema } from '@/lib/validators/recharge';

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
  await RechargeItem.deleteMany({});
});

describe('Module 2 — Recharge Library', () => {
  describe('2.1 Models & DB', () => {
    it('creates a recharge item successfully', async () => {
      const item = await RechargeItem.create({
        title: 'Quick Stretch',
        duration: 10,
        favourite: true,
      });
      expect(item._id).toBeDefined();
      expect(item.title).toBe('Quick Stretch');
      expect(item.duration).toBe(10);
      expect(item.favourite).toBe(true);
      expect(item.active).toBe(true);
    });

    it('fails to create a recharge item with duration > 15', async () => {
      await expect(
        RechargeItem.create({
          title: 'Long nap',
          duration: 30,
        })
      ).rejects.toThrow();
    });

    it('toggles favourite status', async () => {
      const item = await RechargeItem.create({
        title: 'Short walk',
        duration: 15,
        favourite: false,
      });
      
      const updated = await RechargeItem.findByIdAndUpdate(
        item._id,
        { $set: { favourite: true } },
        { new: true }
      );
      
      expect(updated?.favourite).toBe(true);
    });

    it('only lists active items', async () => {
      await RechargeItem.create([
        { title: 'Item 1', duration: 5, active: true },
        { title: 'Item 2', duration: 10, active: false },
        { title: 'Item 3', duration: 15, active: true },
      ]);

      const items = await RechargeItem.find({ active: true }).lean();
      expect(items).toHaveLength(2);
      expect(items.map(i => i.title)).not.toContain('Item 2');
    });
  });

  describe('2.2 Zod Validators', () => {
    it('validates correct recharge item', () => {
      const result = rechargeCreateSchema.safeParse({
        title: 'Tea break',
        duration: 10,
      });
      expect(result.success).toBe(true);
    });

    it('fails validation when duration > 15', () => {
      const result = rechargeCreateSchema.safeParse({
        title: 'Long break',
        duration: 20,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.duration).toBeDefined();
      }
    });

    it('fails validation when duration < 5', () => {
      const result = rechargeCreateSchema.safeParse({
        title: 'Too short',
        duration: 2,
      });
      expect(result.success).toBe(false);
    });

    it('validates partial updates', () => {
      const result = rechargeUpdateSchema.safeParse({
        favourite: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
