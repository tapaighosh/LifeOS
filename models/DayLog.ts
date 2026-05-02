import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILogEntry {
  task_id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const LogEntrySchema: Schema = new Schema({
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
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
  },
  {
    timestamps: true,
  }
);



const DayLog: Model<IDayLog> = mongoose.models.DayLog || mongoose.model<IDayLog>('DayLog', DayLogSchema);

export default DayLog;
