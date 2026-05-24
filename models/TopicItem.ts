/**
 * TopicItem Mongoose Model
 *
 * Represents a single topic (concept queue) or problem (DSA queue) within
 * a TopicQueue. Items are ordered and surface one at a time into the daily plan.
 *
 * Status flow:
 *   pending → in_progress (when surfaced in plan) → covered | skipped
 *
 * DSA-only fields (approach_notes, time_taken, solved_without_hint) are optional
 * and only relevant for queue_type='dsa' queues. They capture honest interview
 * readiness data.
 *
 * `revision` + `next_revision` hook into the spaced-repetition system:
 *   when a user marks a covered item for revision, it surfaces again after
 *   next_revision date.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── TypeScript Interface ─────────────────────────────────────────────────────

export interface ITopicItem extends Document {
  queue_id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  status: 'pending' | 'in_progress' | 'covered' | 'skipped';
  covered_on?: string;       // YYYY-MM-DD
  revision: boolean;
  next_revision?: string;   // YYYY-MM-DD
  notes?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // DSA-only optional fields
  approach_notes?: string;
  time_taken?: number;       // minutes
  solved_without_hint?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const TopicItemSchema: Schema<ITopicItem> = new Schema(
  {
    queue_id: {
      type: Schema.Types.ObjectId,
      ref: 'TopicQueue',
      required: [true, 'queue_id is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'covered', 'skipped'],
        message: 'Status must be one of: pending, in_progress, covered, skipped',
      },
      default: 'pending',
    },
    covered_on: { type: String },
    revision: { type: Boolean, default: false },
    next_revision: { type: String },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be: easy, medium, or hard',
      },
      required: [true, 'Difficulty is required'],
    },
    // DSA-only fields — all optional
    approach_notes: { type: String },
    time_taken: { type: Number, min: 0, max: 600 },
    solved_without_hint: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

TopicItemSchema.index({ queue_id: 1, order: 1 });
TopicItemSchema.index({ status: 1 });
TopicItemSchema.index({ next_revision: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const TopicItem: Model<ITopicItem> =
  mongoose.models.TopicItem ||
  mongoose.model<ITopicItem>('TopicItem', TopicItemSchema);

export default TopicItem;
