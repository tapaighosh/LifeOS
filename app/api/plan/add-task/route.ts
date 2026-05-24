/**
 * PATCH /api/plan/add-task
 *
 * Adds a task to today's existing DailyPlan.
 * Body: { task_id: string, time_start: string, time_end: string }
 *
 * Rules:
 *   - Task must exist and be active
 *   - Today's plan must exist
 *   - Plan must not be locked
 *   - Inserts entry with status='pending'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DailyPlan from '@/models/DailyPlan';
import Task from '@/models/Task';

const addTaskSchema = z.object({
  task_id:    z.string().min(1, 'task_id is required'),
  time_start: z.string().regex(/^\d{2}:\d{2}$/, 'time_start must be HH:MM'),
  time_end:   z.string().regex(/^\d{2}:\d{2}$/, 'time_end must be HH:MM'),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = addTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { task_id, time_start, time_end } = parseResult.data;

    if (!mongoose.Types.ObjectId.isValid(task_id)) {
      return NextResponse.json({ error: 'Invalid task_id', code: 'INVALID_ID' }, { status: 400 });
    }

    await connectDB();

    // Validate task exists and is active
    const task = await Task.findById(task_id).lean();
    if (!task || !task.active) {
      return NextResponse.json({ error: 'Task not found or inactive', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Find today's plan
    const today = new Date().toLocaleDateString('en-CA');
    const plan = await DailyPlan.findOne({ date: today });
    if (!plan) {
      return NextResponse.json({ error: 'No plan found for today', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Lock guard
    if (plan.locked) {
      return NextResponse.json({ error: 'Plan is locked', code: 'PLAN_LOCKED' }, { status: 403 });
    }

    // Push new entry
    plan.plan.push({
      time_start,
      time_end,
      task_id: new mongoose.Types.ObjectId(task_id),
      title: task.title,
      pillar: task.pillar,
      type: task.type,
      energy_cost: task.energy_cost,
      status: 'pending',
      entry_type: 'task',
    });

    await plan.save();

    return NextResponse.json(plan.toObject(), { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/plan/add-task]', error);
    return NextResponse.json(
      { error: 'Failed to add task to plan', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
