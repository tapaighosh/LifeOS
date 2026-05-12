/**
 * TopicQueue Mongoose Model
 *
 * A queue is a named collection of topics or problems the user studies
 * one item at a time. The queue feeds a single "next item" into the daily
 * plan context — users never see all 107 topics at once.
 *
 * queue_type distinguishes concept queues (read/study) from DSA queues
 * (code/solve), which have different completion fields and time allocations.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── TypeScript Interface ─────────────────────────────────────────────────────

export interface ITopicQueue extends Document {
  name: string;
  pillar: 'money' | 'soul' | 'curiosity';
  description?: string;
  queue_type: 'concept' | 'dsa';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const TopicQueueSchema: Schema<ITopicQueue> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Queue name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    pillar: {
      type: String,
      enum: {
        values: ['money', 'soul', 'curiosity'],
        message: 'Pillar must be one of: money, soul, curiosity',
      },
      required: [true, 'Pillar is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    queue_type: {
      type: String,
      enum: {
        values: ['concept', 'dsa'],
        message: 'queue_type must be "concept" or "dsa"',
      },
      required: [true, 'queue_type is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

TopicQueueSchema.index({ active: 1 });
TopicQueueSchema.index({ pillar: 1 });

// ─── Model (singleton for Next.js hot-reload safety) ─────────────────────────

const TopicQueue: Model<ITopicQueue> =
  mongoose.models.TopicQueue ||
  mongoose.model<ITopicQueue>('TopicQueue', TopicQueueSchema);

export default TopicQueue;
