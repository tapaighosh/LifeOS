import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import RechargeItem from '@/models/RechargeItem';
import { rechargeCreateSchema } from '@/lib/validators/recharge';
import { ValidationError } from '@/lib/errors';

const DEFAULT_RECHARGES = [
  { title: 'Morning stretch', duration: 10, favourite: true },
  { title: 'Eyes closed rest', duration: 10, favourite: false },
  { title: 'Short walk', duration: 15, favourite: true },
  { title: 'Tea/coffee no-screen', duration: 15, favourite: false },
  { title: 'Breathing exercise', duration: 5, favourite: false },
  { title: 'Music listening', duration: 10, favourite: true },
  { title: 'Journaling', duration: 15, favourite: false },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    let items = await RechargeItem.find({ active: true }).sort({ favourite: -1, createdAt: -1 }).lean();

    // Seed defaults if empty
    if (items.length === 0) {
      // Check again if any items exist at all, even inactive ones
      const anyItems = await RechargeItem.countDocuments();
      if (anyItems === 0) {
        await RechargeItem.insertMany(DEFAULT_RECHARGES);
        items = await RechargeItem.find({ active: true }).sort({ favourite: -1, createdAt: -1 }).lean();
      }
    }

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('[GET /api/recharge]', error);
    return NextResponse.json(
      { error: 'Failed to fetch recharge items', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const parseResult = rechargeCreateSchema.safeParse(body);

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

    const item = await RechargeItem.create(parseResult.data);

    return NextResponse.json(item.toObject(), { status: 201 });
  } catch (error) {
    console.error('[POST /api/recharge]', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      const ve = new ValidationError(error.message);
      return NextResponse.json({ error: ve.message, code: ve.code }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create recharge item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
