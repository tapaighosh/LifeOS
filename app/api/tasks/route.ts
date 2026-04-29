/**
 * GET  /api/tasks — List all active tasks with optional pillar/type/energy_cost filters
 * POST /api/tasks — Create a new task with full Zod validation
 *
 * Both routes require a valid NextAuth session.
 *
 * Example GET response:
 * [{ _id, title, pillar, type, duration, energy_cost, slot_preference, priority, active, ... }]
 *
 * Example POST request body:
 * { title: "DSA practice", pillar: "money", type: "recurring", duration: 60, energy_cost: "high",
 *   slot_preference: "morning", frequency: "daily", priority: 4 }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';
import { taskCreateSchema, taskQuerySchema } from '@/lib/validators/task';
import { ValidationError } from '@/lib/errors';

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      pillar: searchParams.get('pillar') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      energy_cost: searchParams.get('energy_cost') ?? undefined,
      active: searchParams.get('active') ?? undefined,
    };

    const queryResult = taskQuerySchema.safeParse(rawQuery);
    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: queryResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { pillar, type, energy_cost } = queryResult.data;

    // Build filter — always default to active tasks only
    const filter: Record<string, unknown> = { active: true };
    if (pillar) filter.pillar = pillar;
    if (type) filter.type = type;
    if (energy_cost) filter.energy_cost = energy_cost;

    const tasks = await Task.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(500) // guard against unbounded results
      .lean();

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('[GET /api/tasks]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const parseResult = taskCreateSchema.safeParse(body);

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

    const task = await Task.create(parseResult.data);

    return NextResponse.json(task.toObject(), { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);

    // Surface Mongoose-level validation errors (defence-in-depth after Zod)
    if (error instanceof Error && error.name === 'ValidationError') {
      const ve = new ValidationError(error.message);
      return NextResponse.json(
        { error: ve.message, code: ve.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create task', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
