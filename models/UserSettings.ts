import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserSettings extends Document {
  wake_time: string;
  sleep_time: string;
  leave_time: string;
  return_time: string;
  notification_morning: boolean;
  notification_night: boolean;
  timezone: string;
  pillar_balance_target: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema: Schema<IUserSettings> = new Schema(
  {
    wake_time: { type: String, default: '06:00' },
    sleep_time: { type: String, default: '22:00' },
    leave_time: { type: String, default: '08:30' },
    return_time: { type: String, default: '18:00' },
    notification_morning: { type: Boolean, default: true },
    notification_night: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' },
    pillar_balance_target: { type: String, default: 'even' },
  },
  {
    timestamps: true,
  }
);

const UserSettings: Model<IUserSettings> = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

export default UserSettings;
