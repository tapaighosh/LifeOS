import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRechargeItem extends Document {
  title: string;
  duration: number; // minutes
  favourite: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RechargeItemSchema: Schema<IRechargeItem> = new Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    duration: { 
      type: Number, 
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [15, 'Duration must be 15 minutes or less']
    },
    favourite: { 
      type: Boolean, 
      default: false 
    },
    active: { 
      type: Boolean, 
      default: true 
    },
  },
  {
    timestamps: true,
  }
);

RechargeItemSchema.index({ active: 1 });

const RechargeItem: Model<IRechargeItem> = mongoose.models.RechargeItem || mongoose.model<IRechargeItem>('RechargeItem', RechargeItemSchema);

export default RechargeItem;
