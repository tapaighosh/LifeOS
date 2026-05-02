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

    const { date, locked } = await request.json();
    if (!date || locked === undefined) {
      return NextResponse.json({ error: 'Date and locked status are required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    await connectDB();

    const plan = await DailyPlan.findOneAndUpdate(
      { date },
      { $set: { locked } },
      { new: true }
    ).lean();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true, locked: plan.locked }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/plan/lock]', error);
    return NextResponse.json(
      { error: 'Failed to lock daily plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
