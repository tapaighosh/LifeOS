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
 *   - BUG-10: No two entries may overlap in time
 *   - BUG-11: Requested window must fall within a configured availability slot
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
import UserSettings from '@/models/UserSettings';
import { calculateAvailableSlots } from '@/lib/scheduler/slotCalculator';

const addTaskSchema = z.object({
  task_id:    z.string().min(1, 'task_id is required'),
  time_start: z.string().regex(/^\d{2}:\d{2}$/, 'time_start must be HH:MM'),
  time_end:   z.string().regex(/^\d{2}:\d{2}$/, 'time_end must be HH:MM'),
}).refine((d) => d.time_end > d.time_start, {
  message: 'time_end must be after time_start',
  path: ['time_end'],
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

    // ── BUG-10: Overlap detection ─────────────────────────────────────────────
    // Two time ranges overlap if: start1 < end2 AND end1 > start2
    const hasOverlap = plan.plan.some((entry) =>
      time_start < entry.time_end && time_end > entry.time_start
    );
    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Time window overlaps an existing plan entry', code: 'TIME_OVERLAP' },
        { status: 409 }
      );
    }

    // ── BUG-11: Window validation ─────────────────────────────────────────────
    // Requested time must fall within at least one of the user's configured availability slots.
    const settings = await UserSettings.findOne().lean();
    if (settings) {
      // @ts-ignore — settings shape matches what slotCalculator expects
      const availableSlots = calculateAvailableSlots(today, settings, []);
      const withinASlot = availableSlots.some((slot) => {
        const slotStart = slot.start.toTimeString().slice(0, 5);
        const slotEnd   = slot.end.toTimeString().slice(0, 5);
        return time_start >= slotStart && time_end <= slotEnd;
      });

      if (!withinASlot) {
        return NextResponse.json(
          {
            error: 'Requested time window is outside configured availability slots',
            code: 'OUT_OF_WINDOW',
          },
          { status: 400 }
        );
      }
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
      status: 'planned',
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
