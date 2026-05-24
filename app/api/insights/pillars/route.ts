import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { aggregateWeeklyData } from '@/lib/insights/weeklyAggregator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const { pillarBalance, pillarStreaks, neglectedPillars } = await aggregateWeeklyData(date);
    return NextResponse.json({ pillarBalance, pillarStreaks, neglectedPillars }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/insights/pillars]', error);
    return NextResponse.json({ error: 'Failed to fetch pillar data' }, { status: 500 });
  }
}
