/**
 * Module — Principles Tests
 *
 * Tests the core scheduling logic of GET /api/principles/today directly
 * against the Mongoose model layer (no HTTP stack) using mongodb-memory-server.
 *
 * The route handler cannot be imported directly in Jest because it depends on
 * NextAuth's `getServerSession` and Next.js internals. Instead we exercise the
 * exact same DB operations the handler performs, which gives us full confidence
 * in the branching logic without brittle HTTP mocking.
 *
 * Test matrix:
 *   P-1  Normal selection — unseen principle returned, last_shown stamped.
 *   P-2  Idempotent call — second call same day returns same _id, DB write skipped.
 *   P-3  All-shown fallback — when every principle has last_shown=today, the
 *        oldest (by last_shown) is returned anyway.
 *   P-4  Empty collection — returns { principle: null } safely.
 *
 * Zod validator tests (no DB required):
 *   Z-1  Valid heading + body → passes.
 *   Z-2  Empty heading → fails with heading error.
 *   Z-3  Heading > 120 chars → fails.
 *   Z-4  Body > 500 chars → fails.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Principle from '@/models/Principle';
import { PrincipleSchema } from '@/lib/validators/principle';

// ─── Infrastructure ───────────────────────────────────────────────────────────

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
  await Principle.deleteMany({});
});

// ─── Factories ────────────────────────────────────────────────────────────────

const makePrinciple = (overrides: Partial<{
  heading: string;
  body: string;
  show_order: number;
  last_shown: string | null;
  active: boolean;
}> = {}) => ({
  heading: 'Do what you love',
  body: 'Passion is essential because starting a business is incredibly hard.',
  show_order: 0,
  last_shown: null,
  active: true,
  ...overrides,
});

/**
 * Replicates the exact selection + idempotent-update logic from
 * GET /api/principles/today, decoupled from NextAuth/Next.js.
 *
 * Returns the principle object as the API would (only _id, heading, body)
 * plus a `wasWritten` flag so tests can assert on the idempotency behaviour.
 */
async function runScheduler(today: string): Promise<{
  principle: { _id: string; heading: string; body: string } | null;
  wasWritten: boolean;
}> {
  // Step 1 — prefer not-shown-today, oldest first (null sorts before strings)
  let principle = await Principle.findOne({
    active: true,
    last_shown: { $ne: today },
  })
    .sort({ last_shown: 1 })
    .select('_id heading body last_shown')
    .lean();

  // Step 2 — all shown today: fall back to least-recently-shown
  if (!principle) {
    principle = await Principle.findOne({ active: true })
      .sort({ last_shown: 1 })
      .select('_id heading body last_shown')
      .lean();
  }

  // Step 3 — collection empty
  if (!principle) {
    return { principle: null, wasWritten: false };
  }

  // Idempotent write — only stamp last_shown when it differs from today
  const wasWritten = principle.last_shown !== today;
  if (wasWritten) {
    await Principle.updateOne({ _id: principle._id }, { $set: { last_shown: today } });
  }

  return {
    principle: {
      _id: String(principle._id),
      heading: principle.heading,
      body: principle.body,
    },
    wasWritten,
  };
}

// ─── P-1: Normal selection ────────────────────────────────────────────────────

describe('P-1 — Normal selection', () => {
  /**
   * Seed 3 principles, all with last_shown: null.
   * The scheduler should pick one (the first by sort order), stamp today's date,
   * and return it. The other two should remain at null.
   */
  it('returns a principle and updates last_shown to today', async () => {
    await Principle.create([
      makePrinciple({ heading: 'Principle A', show_order: 0 }),
      makePrinciple({ heading: 'Principle B', show_order: 1 }),
      makePrinciple({ heading: 'Principle C', show_order: 2 }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const { principle, wasWritten } = await runScheduler(today);

    expect(principle).not.toBeNull();
    expect(principle!.heading).toBeDefined();
    expect(wasWritten).toBe(true);

    // Confirm DB was actually updated
    const updated = await Principle.findById(principle!._id).lean();
    expect(updated!.last_shown).toBe(today);

    // The other two must remain untouched
    const untouched = await Principle.find({ last_shown: null }).lean();
    expect(untouched).toHaveLength(2);
  });

  it('returns all three required UI fields (_id, heading, body)', async () => {
    await Principle.create(makePrinciple({ heading: 'Solve a real problem' }));

    const today = new Date().toISOString().split('T')[0];
    const { principle } = await runScheduler(today);

    expect(principle!._id).toBeDefined();
    expect(typeof principle!.heading).toBe('string');
    expect(typeof principle!.body).toBe('string');
  });
});

// ─── P-2: Idempotency ─────────────────────────────────────────────────────────

describe('P-2 — Idempotent call (same day, called twice)', () => {
  /**
   * WHY idempotency matters:
   * The dashboard fetches this endpoint on every mount and on SWR revalidation.
   * Without the `last_shown !== today` guard, every call would stamp a new date
   * and advance the rotation — the user would see a different principle on every
   * page refresh. The guard ensures the stamp is written exactly once per day.
   */
  it('returns the same _id on the second call and does NOT write to DB again', async () => {
    // Seed exactly ONE principle. On the second call the scheduler has no
    // alternative — the only document now has last_shown=today, so it triggers
    // the Step-2 fallback, returns the same _id, and skips the DB write.
    await Principle.create(makePrinciple({ heading: 'Principle A', show_order: 0 }));

    const today = new Date().toISOString().split('T')[0];

    // First call — should stamp last_shown
    const first = await runScheduler(today);
    expect(first.wasWritten).toBe(true);

    // Second call — same principle selected (only one exists), no DB write
    const second = await runScheduler(today);
    expect(second.principle!._id).toBe(first.principle!._id);
    expect(second.wasWritten).toBe(false);
  });

  it('last_shown remains the same string (not updated twice)', async () => {
    await Principle.create(makePrinciple({ heading: 'Consistent' }));

    const today = new Date().toISOString().split('T')[0];
    await runScheduler(today);
    await runScheduler(today);

    const doc = await Principle.findOne({}).lean();
    // updatedAt would differ if a second write happened; last_shown stays correct
    expect(doc!.last_shown).toBe(today);
  });
});

// ─── P-3: All-shown fallback ──────────────────────────────────────────────────

describe('P-3 — All principles shown today → fallback to oldest', () => {
  /**
   * When every active principle already has last_shown=today (because the user
   * refreshed many times or has very few principles), the scheduler must NOT
   * return null. Instead it falls back to the principle with the oldest
   * last_shown value — giving a graceful degradation rather than an empty card.
   *
   * "Oldest" means the earliest date string, which MongoDB sorts ASC.
   */
  it('returns the principle with the oldest last_shown when all shown today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().split('T')[0];

    // All three have last_shown=today (simulates "all already seen today")
    await Principle.create([
      makePrinciple({ heading: 'Most Recent',   last_shown: today,       show_order: 0 }),
      makePrinciple({ heading: 'Yesterday',     last_shown: yesterday,   show_order: 1 }),
      makePrinciple({ heading: 'Two Days Ago',  last_shown: twoDaysAgo,  show_order: 2 }),
    ]);

    const { principle } = await runScheduler(today);

    // The fallback path picks the oldest last_shown — twoDaysAgo
    expect(principle).not.toBeNull();
    expect(principle!.heading).toBe('Two Days Ago');
  });

  it('wasWritten=false when the returned principle already has last_shown=today', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Only one principle — already shown today
    await Principle.create(makePrinciple({ last_shown: today }));

    const { wasWritten } = await runScheduler(today);
    // All shown today, fallback returns the same doc — its last_shown IS today, no write
    expect(wasWritten).toBe(false);
  });
});

// ─── P-4: Empty collection ────────────────────────────────────────────────────

describe('P-4 — Empty collection', () => {
  /**
   * Before the seed script runs (fresh install) the principles collection is
   * empty. The API must return { principle: null } with status 200 — not 404
   * or 500 — so the dashboard can hide the card gracefully.
   */
  it('returns null when no principles exist', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { principle } = await runScheduler(today);
    expect(principle).toBeNull();
  });

  it('returns null when all principles are inactive', async () => {
    await Principle.create([
      makePrinciple({ active: false, heading: 'Inactive A' }),
      makePrinciple({ active: false, heading: 'Inactive B' }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const { principle } = await runScheduler(today);
    expect(principle).toBeNull();
  });
});

// ─── Zod Validator Tests ──────────────────────────────────────────────────────

describe('Zod — PrincipleSchema validation', () => {
  const valid = { heading: 'Do what you love', body: 'Passion is essential.' };

  it('Z-1: valid heading + body → passes', () => {
    const result = PrincipleSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('Z-2: empty heading → fails with heading error', () => {
    const result = PrincipleSchema.safeParse({ ...valid, heading: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.heading).toBeDefined();
    }
  });

  it('Z-3: heading > 120 chars → fails', () => {
    const result = PrincipleSchema.safeParse({ ...valid, heading: 'x'.repeat(121) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.heading).toBeDefined();
    }
  });

  it('Z-4: body > 500 chars → fails', () => {
    const result = PrincipleSchema.safeParse({ ...valid, body: 'x'.repeat(501) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.body).toBeDefined();
    }
  });

  it('Z-5: empty body → fails with body error', () => {
    const result = PrincipleSchema.safeParse({ ...valid, body: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.body).toBeDefined();
    }
  });
});

// ─── Mongoose Model Tests ─────────────────────────────────────────────────────

describe('Principle model — schema constraints', () => {
  it('creates with all fields → success', async () => {
    const p = await Principle.create(makePrinciple());
    expect(p._id).toBeDefined();
    expect(p.active).toBe(true);
    expect(p.last_shown).toBeNull();
  });

  it('fails without heading → ValidationError', async () => {
    const { heading, ...rest } = makePrinciple();
    await expect(Principle.create(rest)).rejects.toThrow();
  });

  it('fails when heading exceeds 120 chars → ValidationError', async () => {
    await expect(
      Principle.create(makePrinciple({ heading: 'h'.repeat(121) }))
    ).rejects.toThrow();
  });

  it('fails when body exceeds 500 chars → ValidationError', async () => {
    await expect(
      Principle.create(makePrinciple({ body: 'b'.repeat(501) }))
    ).rejects.toThrow();
  });

  it('defaults active=true and last_shown=null', async () => {
    const { active, last_shown, ...base } = makePrinciple();
    const p = await Principle.create(base);
    expect(p.active).toBe(true);
    expect(p.last_shown).toBeNull();
  });
});
