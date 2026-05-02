import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DayLog from '@/models/DayLog';

export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { date } = params;

    await connectDB();

    const log = await DayLog.findOne({ date }).lean();

    if (!log) {
      return NextResponse.json(null, { status: 200 }); // Not checked in yet
    }

    return NextResponse.json(log, { status: 200 });
  } catch (error) {
    console.error(`[GET /api/log/${params.date}]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch day log', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
