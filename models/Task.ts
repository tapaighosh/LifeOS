/**
 * Task Mongoose Model
 *
 * Represents a user-defined task in the LifeOS system. Tasks are the atomic unit
 * of scheduling — the AI uses them to compose daily plans across three life pillars.
 *
 * Key constraints enforced here (and mirrored in Zod):
 *  - recharge tasks must have duration <= 15 min (enforced via pre-validate hook)
 *  - duration is restricted to allowed scheduling slots: 15|30|45|60|90|120
 *  - soft delete via `active: false` — user data is never hard-deleted
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface ITask extends Document {
  title: string;
  pillar: 'money' | 'soul' | 'curiosity';
  category?: string;
  type: 'recurring' | 'one-time' | 'project' | 'recharge';
  duration: 15 | 30 | 45 | 60 | 90 | 120;
  energy_cost: 'high' | 'medium' | 'low';
  slot_preference: 'morning' | 'evening' | 'any';
  frequency?: 'daily' | 'alternate' | '3x_week' | 'weekly' | 'custom';
  revision: boolean;
  revision_cycle?: number[];
  priority: number;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    pillar: {
      type: String,
      enum: {
        values: ['money', 'soul', 'curiosity'],
        message: 'Pillar must be one of: money, soul, curiosity',
      },
      required: [true, 'Pillar is required'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['recurring', 'one-time', 'project', 'recharge'],
        message: 'Type must be one of: recurring, one-time, project, recharge',
      },
      required: [true, 'Task type is required'],
    },
    duration: {
      type: Number,
      enum: {
        values: [15, 30, 45, 60, 90, 120],
        message: 'Duration must be one of: 15, 30, 45, 60, 90, 120 minutes',
      },
      required: [true, 'Duration is required'],
    },
    energy_cost: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Energy cost must be one of: high, medium, low',
      },
      required: [true, 'Energy cost is required'],
    },
    slot_preference: {
      type: String,
      enum: {
        values: ['morning', 'evening', 'any'],
        message: 'Slot preference must be one of: morning, evening, any',
      },
      default: 'any',
    },
    frequency: {
      type: String,
      enum: {
        values: ['daily', 'alternate', '3x_week', 'weekly', 'custom'],
        message: 'Frequency must be one of: daily, alternate, 3x_week, weekly, custom',
      },
    },
    revision: {
      type: Boolean,
      default: false,
    },
    // Default spaced-repetition cycle intervals in days: [1, 3, 7, 14]
    revision_cycle: {
      type: [Number],
      default: [1, 3, 7, 14],
    },
    // Priority 1–5: used by AI as scheduling weight (5 = highest priority)
    priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [5, 'Priority cannot exceed 5'],
      default: 3,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    // Soft delete flag — never set active=false directly, use DELETE /api/tasks/:id
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Validation Hook ─────────────────────────────────────────────────────────

/**
 * Recharge tasks are micro-breaks (10–15 min max).
 * Enforced both here and in the Zod validator for defence-in-depth.
 */
TaskSchema.pre('validate', function (next) {
  if (this.type === 'recharge' && this.duration > 15) {
    this.invalidate(
      'duration',
      'Recharge tasks must have a duration of 15 minutes or less',
      this.duration
    );
  }
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

TaskSchema.index({ pillar: 1 });
TaskSchema.index({ active: 1 });
TaskSchema.index({ type: 1 });
TaskSchema.index({ priority: -1 }); // AI sorts by priority DESC when building plans

// ─── Model (singleton pattern for Next.js hot-reload safety) ─────────────────

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
