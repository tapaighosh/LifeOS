import mongoose, { Schema, Document, Model } from 'mongoose';

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

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: { type: String, required: true },
    pillar: { type: String, enum: ['money', 'soul', 'curiosity'], required: true },
    category: { type: String },
    type: { type: String, enum: ['recurring', 'one-time', 'project', 'recharge'], required: true },
    duration: { type: Number, enum: [15, 30, 45, 60, 90, 120], required: true },
    energy_cost: { type: String, enum: ['high', 'medium', 'low'], required: true },
    slot_preference: { type: String, enum: ['morning', 'evening', 'any'], default: 'any' },
    frequency: { type: String, enum: ['daily', 'alternate', '3x_week', 'weekly', 'custom'] },
    revision: { type: Boolean, default: false },
    revision_cycle: { type: [Number], default: [1, 3, 7, 14] },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    notes: { type: String },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ pillar: 1 });
TaskSchema.index({ active: 1 });
TaskSchema.index({ type: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
