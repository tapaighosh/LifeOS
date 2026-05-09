/**
 * Challenge Mongoose Model
 *
 * A Challenge is a container that sits above a Task. It owns progress tracking,
 * streak counting, and completion state. The linked Task is the schedulable unit
 * the existing scheduler picks up — the challenge layer is invisible to the planner.
 *
 * Three challenge types:
 *   streak      — must be consecutive (cold shower 30 days). Missed day resets streak.
 *   total_count — cumulative (12 books). Missed day = just a missed day.
 *   milestone   — single completion event (run 5km without stopping).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface IChallenge extends Document {
  title: string;
  category: 'physical' | 'mental' | 'financial' | 'social' | 'creative';
  description?: string;
  target_type: 'streak' | 'total_count' | 'milestone';
  target_value: number;
  started_on?: string;         // YYYY-MM-DD
  status: 'active' | 'completed' | 'dropped' | 'paused';
  linked_task_id?: mongoose.Types.ObjectId;
  current_streak: number;
  best_streak: number;
  total_completed: number;
  last_completed_on?: string;  // YYYY-MM-DD
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const ChallengeSchema: Schema<IChallenge> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ['physical', 'mental', 'financial', 'social', 'creative'],
        message: 'Category must be one of: physical, mental, financial, social, creative',
      },
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    target_type: {
      type: String,
      enum: {
        values: ['streak', 'total_count', 'milestone'],
        message: 'Target type must be one of: streak, total_count, milestone',
      },
      required: [true, 'Target type is required'],
    },
    // Number of units required to complete (days for streak, count for total_count, 1 for milestone)
    target_value: {
      type: Number,
      required: [true, 'Target value is required'],
      min: [1, 'Target value must be at least 1'],
    },
    // ISO date string (YYYY-MM-DD) — set when user accepts the challenge
    started_on: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'dropped', 'paused'],
        message: 'Status must be one of: active, completed, dropped, paused',
      },
      default: 'active',
    },
    // Reference to the recurring Task created when challenge was accepted
    linked_task_id: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    // Only meaningful for streak challenges — consecutive completions
    current_streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    best_streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Total times the linked task was marked 'done' since challenge started
    total_completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Last date the linked task was marked done in a check-in (YYYY-MM-DD)
    last_completed_on: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

ChallengeSchema.index({ status: 1 });
ChallengeSchema.index({ linked_task_id: 1 }, { unique: true, sparse: true });

// ─── Model (singleton pattern for Next.js hot-reload safety) ─────────────────

const Challenge: Model<IChallenge> =
  mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;
