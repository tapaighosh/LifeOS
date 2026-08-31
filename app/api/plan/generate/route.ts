import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserSettings from '@/models/UserSettings';
import DailyPlan from '@/models/DailyPlan';
import { generateAndParsePlan } from '@/lib/ai/responseParser';
import { collectPlanContext } from '@/lib/scheduler/contextCollector';
import { generatePlan } from '@/lib/scheduler/planGenerator';
import { validateAIPlan } from '@/lib/ai/planValidator';

// Stale lock threshold — if a generation lock is older than this, a crashed request
// is assumed and the lock can be overridden.
const LOCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export async function POST(request: NextRequest) {
  const { date } = await request.json(); // Expected YYYY-MM-DD

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    await connectDB();

    // ── Step 1: Check user-initiated lock (takes priority over generation lock) ──
    const existingPlan = await DailyPlan.findOne({ date });
    if (existingPlan?.locked) {
      return NextResponse.json(
        { error: 'Plan is locked and cannot be regenerated', code: 'PLAN_LOCKED' },
        { status: 400 }
      );
    }

    // ── Step 2: Atomically acquire the generation lock ────────────────────────
    // This prevents two concurrent requests from both calling the AI and overwriting each other.
    // The filter matches only if generating is false OR the lock is stale (crashed request).
    const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MS);
    const lockResult = await DailyPlan.findOneAndUpdate(
      {
        date,
        $or: [
          { generating: { $ne: true } },
          { generating: { $exists: false } },
          { generating_since: { $lt: staleThreshold } }, // stale lock — override
        ],
      },
      { $set: { generating: true, generating_since: new Date() } },
      { upsert: true, new: true }
    );

    // If findOneAndUpdate returned null, another request holds the lock
    if (!lockResult) {
      return NextResponse.json(
        { error: 'Plan generation already in progress', code: 'GENERATION_IN_PROGRESS' },
        { status: 409 }
      );
    }

    const settings = await UserSettings.findOne().lean();
    if (!settings) {
      // Release lock before returning error
      await DailyPlan.findOneAndUpdate({ date }, { $set: { generating: false } }).catch(() => {});
      return NextResponse.json(
        { error: 'User settings not configured', code: 'SETTINGS_MISSING' },
        { status: 400 }
      );
    }

    try {
      // ── Step 3: Collect context and generate plan ─────────────────────────
      // @ts-ignore
      const context = await collectPlanContext(date, settings);

      let planDoc: any;

      // ── Step 4: Attempt AI generation ────────────────────────────────────
      console.time('[AI] Generate Plan');
      const aiPlan = await generateAndParsePlan(context);
      console.timeEnd('[AI] Generate Plan');

      if (aiPlan) {
        // ── Step 5: Business validation (DB ID existence + time overlap check) ──
        const validation = await validateAIPlan(aiPlan);
        if (!validation.valid) {
          console.warn('[AI] Plan failed business validation, falling back to rule-based:', validation.errors);
          // planDoc stays undefined — falls through to rule-based below
        } else {
          console.log('[AI] Successfully generated and validated plan with AI');
          planDoc = {
            date,
            locked: false,
            source: 'ai',
            plan: aiPlan.plan.map((t: any) => ({ ...t, status: 'pending' })),
            skipped_tasks: aiPlan.skipped_tasks,
            ai_note: aiPlan.ai_note,
          };
        }
      }

      // ── Step 6: Rule-based fallback (if AI failed or business validation failed) ──
      if (!planDoc) {
        console.log('[AI] Using rule-based scheduler');
        planDoc = generatePlan(context);
      }

      // ── Step 7: Save to DB — release generation lock in same write ────────
      planDoc.generating = false;
      planDoc.generating_since = null;

      const savedPlan = await DailyPlan.findOneAndUpdate(
        { date },
        { $set: planDoc },
        { new: true, upsert: true, returnDocument: 'after' }
      ).lean();

      return NextResponse.json(savedPlan, { status: 200 });
    } catch (error) {
      // Always release lock on inner error to prevent permanent blocking
      await DailyPlan.findOneAndUpdate(
        { date },
        { $set: { generating: false } }
      ).catch(() => {}); // swallow — already in error state

      throw error; // re-throw for outer catch
    }
  } catch (error) {
    console.error('[POST /api/plan/generate]', error);
    return NextResponse.json(
      { error: 'Failed to generate daily plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
