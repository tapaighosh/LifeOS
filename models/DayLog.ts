import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILogEntry {
  task_id?: Types.ObjectId;
  topic_item_id?: Types.ObjectId;
  entry_type?: 'task' | 'queue_topic';
  status: 'done' | 'partial' | 'skipped';
  completion_pct?: number; // 25, 50, 75
  skip_reason?: string; // 'tired', 'no time', 'forgot', 'spontaneous'
}

export interface IDayLog extends Document {
  date: string; // YYYY-MM-DD
  entries: ILogEntry[];
  energy_rating: number; // 1-5
  reflection?: string;
  ai_insight?: string;
  /** Guards against double-submission. Once true, the checkin route returns 409. */
  is_submitted: boolean;
  /** Timestamp of the first (valid) submission. Null until first submit. */
  submitted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LogEntrySchema: Schema = new Schema({
  task_id: { type: Schema.Types.ObjectId, ref: 'Task' },
  topic_item_id: { type: Schema.Types.ObjectId, ref: 'TopicItem' },
  entry_type: { type: String, enum: ['task', 'queue_topic'], default: 'task' },
  status: { type: String, enum: ['done', 'partial', 'skipped'], required: true },
  completion_pct: { type: Number, enum: [25, 50, 75] },
  skip_reason: { type: String },
});

const DayLogSchema: Schema<IDayLog> = new Schema(
  {
    date: { type: String, required: true, unique: true },
    entries: { type: [LogEntrySchema], default: [] },
    energy_rating: { type: Number, min: 1, max: 5, required: true },
    reflection: { type: String, maxlength: 200 },
    ai_insight: { type: String },
    is_submitted: { type: Boolean, default: false },
    submitted_at: { type: Date },
  },
  {
    timestamps: true,
  }
);



const DayLog: Model<IDayLog> = mongoose.models.DayLog || mongoose.model<IDayLog>('DayLog', DayLogSchema);

export default DayLog;
