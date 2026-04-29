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
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    favourite: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

RechargeItemSchema.index({ active: 1 });

const RechargeItem: Model<IRechargeItem> = mongoose.models.RechargeItem || mongoose.model<IRechargeItem>('RechargeItem', RechargeItemSchema);

export default RechargeItem;
