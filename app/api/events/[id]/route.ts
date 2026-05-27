import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import EventBlock from '@/models/EventBlock';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let id = 'unknown';
  try {
    id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await EventBlock.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/events/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
