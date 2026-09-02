import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRevisionQueue extends Document {
  task_id: Types.ObjectId;
  original_title: string;
  learned_on: Date;
  next_revision: Date;
  revision_history: Date[];
  cycle_index: number;
  status: 'active' | 'mastered' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const RevisionQueueSchema: Schema<IRevisionQueue> = new Schema(
  {
    task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    original_title: { type: String, required: true },
    learned_on: { type: Date, required: true },
    next_revision: { type: Date, required: true },
    revision_history: { type: [Date], default: [] },
    cycle_index: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'mastered', 'paused'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

RevisionQueueSchema.index({ next_revision: 1 });
RevisionQueueSchema.index({ task_id: 1 });
RevisionQueueSchema.index({ status: 1 });

const RevisionQueue: Model<IRevisionQueue> =
  mongoose.models.RevisionQueue || mongoose.model<IRevisionQueue>('RevisionQueue', RevisionQueueSchema);

export default RevisionQueue;
