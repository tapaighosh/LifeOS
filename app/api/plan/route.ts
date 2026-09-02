import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import DailyPlan from '@/models/DailyPlan';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const plan = await DailyPlan.findOne({ date }).populate('skipped_tasks').lean();

    return NextResponse.json(plan || null);
  } catch (error) {
    console.error('Fetch plan error:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

// ─── BUG-19: Validate plan array entries before writing to DB ──────────────
// Previously, any shape was accepted for `plan` and written directly to MongoDB.
// A client bug or malicious payload could corrupt the plan array.
const patchPlanEntrySchema = z.object({
  task_id:       z.string().optional(),
  topic_item_id: z.string().optional(),
  entry_type:    z.enum(['task', 'queue_topic', 'recharge']),
  title:         z.string().min(1),
  time_start:    z.string().regex(/^\d{2}:\d{2}$/, 'time_start must be HH:MM'),
  time_end:      z.string().regex(/^\d{2}:\d{2}$/, 'time_end must be HH:MM'),
  pillar:        z.enum(['money', 'soul', 'curiosity']),
  energy_cost:   z.enum(['low', 'medium', 'high']),
  type:          z.enum(['recurring', 'one-time', 'project', 'recharge']),
  status:        z.enum(['pending', 'done', 'skipped', 'partial', 'expired']),
});

const patchPlanSchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  plan:   z.array(patchPlanEntrySchema).optional(),
  locked: z.boolean().optional(),
  paused: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = patchPlanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { date, plan, locked, paused } = parseResult.data;

    const updateData: any = {};
    if (plan   !== undefined) updateData.plan   = plan;
    if (locked !== undefined) updateData.locked = locked;
    if (paused !== undefined) updateData.paused = paused;

    const updatedPlan = await DailyPlan.findOneAndUpdate(
      { date },
      { $set: updateData },
      { new: true }
    );

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
