import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserSettings from '@/models/UserSettings';
import { settingsUpdateSchema } from '@/lib/validators/settings';
import { ValidationError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    // Since it's single user for now, we just find the first settings document
    // If multi-user later, we'd query by userId
    let settings = await UserSettings.findOne().lean();

    // Auto-create defaults if none exist
    if (!settings) {
      const defaultSettings = await UserSettings.create({
        wake_time: '06:00',
        sleep_time: '22:00',
        leave_time: '08:30',
        return_time: '18:00',
        notification_morning: '06:15',
        notification_night: '21:30',
        timezone: 'Asia/Kolkata',
        pillar_balance_target: { money: 40, soul: 30, curiosity: 30 },
      });
      settings = defaultSettings.toObject();
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('[GET /api/settings]', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parseResult = settingsUpdateSchema.safeParse(body);

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

    const settingsToUpdate = await UserSettings.findOne();
    if (!settingsToUpdate) {
      return NextResponse.json(
        { error: 'User settings not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = await UserSettings.findByIdAndUpdate(
      settingsToUpdate._id,
      { $set: parseResult.data },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/settings]', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      const ve = new ValidationError(error.message);
      return NextResponse.json({ error: ve.message, code: ve.code }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update user settings', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
