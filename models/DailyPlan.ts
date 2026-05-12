import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPlanEntry {
  time_start: string;
  time_end: string;
  task_id?: Types.ObjectId;          // undefined for queue_topic entries
  topic_item_id?: Types.ObjectId;    // set when entry_type='queue_topic'
  title: string;
  pillar: 'money' | 'soul' | 'curiosity';
  type: 'recurring' | 'one-time' | 'project' | 'recharge';
  energy_cost: 'high' | 'medium' | 'low';
  status: 'pending' | 'done' | 'partial' | 'skipped';
  /** Distinguishes entry origin: real task, break, or learning queue topic */
  entry_type?: 'task' | 'recharge' | 'queue_topic';
}

export interface IDailyPlan extends Document {
  date: string; // YYYY-MM-DD
  plan: IPlanEntry[];
  ai_note?: string;
  source: 'ai' | 'rule-based';
  skipped_tasks: Types.ObjectId[];
  locked: boolean;
  paused: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanEntrySchema: Schema = new Schema({
  time_start: { type: String, required: true },
  time_end: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task' },         // optional for queue_topic entries
  topic_item_id: { type: Schema.Types.ObjectId, ref: 'TopicItem' }, // set for queue_topic entries
  title: { type: String, required: true },
  pillar: { type: String, enum: ['money', 'soul', 'curiosity'], required: true },
  type: { type: String, enum: ['recurring', 'one-time', 'project', 'recharge'], required: true },
  energy_cost: { type: String, enum: ['high', 'medium', 'low'], required: true },
  status: { type: String, enum: ['pending', 'done', 'partial', 'skipped'], default: 'pending' },
  entry_type: { type: String, enum: ['task', 'recharge', 'queue_topic'], default: 'task' },
});

const DailyPlanSchema: Schema<IDailyPlan> = new Schema(
  {
    date: { type: String, required: true, unique: true },
    plan: { type: [PlanEntrySchema], required: true },
    ai_note: { type: String },
    source: { type: String, enum: ['ai', 'rule-based'], required: true },
    skipped_tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    locked: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const DailyPlan: Model<IDailyPlan> =
  mongoose.models.DailyPlan ||
  mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);

export default DailyPlan;
