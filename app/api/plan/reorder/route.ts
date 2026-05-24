import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { date, newPlan } = await request.json();
    if (!date || !newPlan) {
      return NextResponse.json({ error: 'Date and newPlan are required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    await connectDB();

    const existingPlan = await DailyPlan.findOne({ date });
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    
    if (existingPlan.locked) {
      return NextResponse.json(
        { error: 'Plan is locked and cannot be modified', code: 'PLAN_LOCKED' },
        { status: 400 }
      );
    }

    // Since we are replacing the entire plan array with the reordered one:
    existingPlan.plan = newPlan;
    await existingPlan.save();

    return NextResponse.json({ success: true, plan: existingPlan.plan }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/plan/reorder]', error);
    return NextResponse.json(
      { error: 'Failed to reorder daily plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
