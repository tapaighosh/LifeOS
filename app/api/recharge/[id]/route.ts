import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import RechargeItem from '@/models/RechargeItem';
import { rechargeUpdateSchema } from '@/lib/validators/recharge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let id = 'unknown';
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    id = (await params).id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid item ID', code: 'INVALID_ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const parseResult = rechargeUpdateSchema.safeParse(body);

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

    const updated = await RechargeItem.findByIdAndUpdate(
      id,
      { $set: parseResult.data },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Recharge item not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/recharge/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update recharge item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let id = 'unknown';
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    id = (await params).id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid item ID', code: 'INVALID_ID' }, { status: 400 });
    }

    await connectDB();

    const deleted = await RechargeItem.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!deleted) {
      return NextResponse.json({ error: 'Recharge item not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recharge item deactivated', id }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/recharge/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete recharge item', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
