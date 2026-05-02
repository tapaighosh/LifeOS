import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserSettings from '@/models/UserSettings';
import DailyPlan from '@/models/DailyPlan';
import { collectPlanContext } from '@/lib/scheduler/contextCollector';
import { generatePlan } from '@/lib/scheduler/planGenerator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { date } = await request.json(); // Expected YYYY-MM-DD
    if (!date) {
      return NextResponse.json({ error: 'Date is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    await connectDB();

    // Check if plan exists and is locked
    const existingPlan = await DailyPlan.findOne({ date });
    if (existingPlan?.locked) {
      return NextResponse.json(
        { error: 'Plan is locked and cannot be regenerated', code: 'PLAN_LOCKED' },
        { status: 400 }
      );
    }

    const settings = await UserSettings.findOne().lean();
    if (!settings) {
      return NextResponse.json(
        { error: 'User settings not configured', code: 'SETTINGS_MISSING' },
        { status: 400 }
      );
    }

    // Generate Context
    // @ts-ignore
    const context = await collectPlanContext(date, settings);
    
    // Generate Plan
    const planDoc = generatePlan(context);

    // Save to DB (Upsert)
    const savedPlan = await DailyPlan.findOneAndUpdate(
      { date },
      { $set: planDoc },
      { new: true, upsert: true, returnDocument: 'after' }
    ).lean();

    return NextResponse.json(savedPlan, { status: 200 });
  } catch (error) {
    console.error('[POST /api/plan/generate]', error);
    return NextResponse.json(
      { error: 'Failed to generate daily plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
