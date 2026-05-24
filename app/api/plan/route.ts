import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, plan, locked, paused } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (plan !== undefined) updateData.plan = plan;
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
