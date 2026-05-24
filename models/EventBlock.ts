import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventBlock extends Document {
  date_start: Date;
  date_end: Date;
  type: 'trek' | 'travel' | 'bike_ride' | 'cooking_exp' | 'rest_day' | 'custom';
  label: string;
  impact?: string;
  prep_task_added: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventBlockSchema: Schema<IEventBlock> = new Schema(
  {
    date_start: { type: Date, required: true },
    date_end: { type: Date, required: true },
    type: { 
      type: String, 
      enum: ['trek', 'travel', 'bike_ride', 'cooking_exp', 'rest_day', 'custom'], 
      required: true 
    },
    label: { type: String, required: true },
    impact: { type: String },
    prep_task_added: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

EventBlockSchema.index({ date_start: 1, date_end: 1 });

const EventBlock: Model<IEventBlock> = mongoose.models.EventBlock || mongoose.model<IEventBlock>('EventBlock', EventBlockSchema);

export default EventBlock;
