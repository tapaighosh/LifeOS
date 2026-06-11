import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import EventBlock from '@/models/EventBlock';
import { handleEventCreated } from '@/lib/events/rescheduleHandler';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    // Use date_end for the split: a multi-day event that started yesterday but ends
    // tomorrow is still "upcoming". date_start would wrongly move it to past.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [upcomingEvents, pastEvents] = await Promise.all([
      EventBlock.find({ date_end: { $gte: todayStart } })
        .sort({ date_start: 1 })   // next event first
        .lean(),
      EventBlock.find({ date_end: { $lt: todayStart } })
        .sort({ date_start: -1 })  // most-recent past event first
        .lean(),
    ]);

    return NextResponse.json({ upcoming: upcomingEvents, past: pastEvents }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/events]', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { date_start, date_end, type, label, impact } = body;

    if (!date_start || !date_end || !type || !label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    
    const newEvent = await EventBlock.create({
      date_start: new Date(date_start),
      date_end: new Date(date_end),
      type,
      label,
      impact,
      prep_task_added: false,
    });

    await handleEventCreated(newEvent);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events]', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
