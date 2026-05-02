import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Optional date override, defaults to today
    const dateParam = searchParams.get('date');
    
    let targetDate = '';
    if (dateParam) {
      targetDate = dateParam;
    } else {
      const now = new Date();
      // Format as YYYY-MM-DD local time
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    await connectDB();

    const plan = await DailyPlan.findOne({ date: targetDate }).lean();

    if (!plan) {
      // 404 is fine here, front-end will show "Generate Plan" button
      return NextResponse.json(null, { status: 200 }); 
    }

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error('[GET /api/plan/today]', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
