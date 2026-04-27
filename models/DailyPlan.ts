import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPlanEntry {
  time_start: string;
  time_end: string;
  task_id: Types.ObjectId;
  title: string;
  pillar: 'money' | 'soul' | 'curiosity';
  type: 'recurring' | 'one-time' | 'project' | 'recharge';
  energy_cost: 'high' | 'medium' | 'low';
  status: 'pending' | 'done' | 'partial' | 'skipped';
}

export interface IDailyPlan extends Document {
  date: string; // YYYY-MM-DD
  plan: IPlanEntry[];
  ai_note?: string;
  source: 'ai' | 'rule-based';
  skipped_tasks: Types.ObjectId[];
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanEntrySchema: Schema = new Schema({
  time_start: { type: String, required: true },
  time_end: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  title: { type: String, required: true },
  pillar: { type: String, enum: ['money', 'soul', 'curiosity'], required: true },
  type: { type: String, enum: ['recurring', 'one-time', 'project', 'recharge'], required: true },
  energy_cost: { type: String, enum: ['high', 'medium', 'low'], required: true },
  status: { type: String, enum: ['pending', 'done', 'partial', 'skipped'], default: 'pending' },
});

const DailyPlanSchema: Schema<IDailyPlan> = new Schema(
  {
    date: { type: String, required: true, unique: true },
    plan: { type: [PlanEntrySchema], required: true },
    ai_note: { type: String },
    source: { type: String, enum: ['ai', 'rule-based'], required: true },
    skipped_tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    locked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

DailyPlanSchema.index({ date: 1 });

const DailyPlan: Model<IDailyPlan> = mongoose.models.DailyPlan || mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);

export default DailyPlan;
