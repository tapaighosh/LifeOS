import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface StoredPushSubscription {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface IUserSettings extends Document {
  wake_time: string;
  sleep_time: string;
  leave_time: string;
  return_time: string;
  notification_morning: string;
  notification_night: string;
  timezone: string;
  pillar_balance_target: {
    money: number;
    soul: number;
    curiosity: number;
  };
  /** Minutes reserved for overhead/breaks not counted in net schedulable capacity. Default: 30 */
  overhead_budget_minutes: number;
  days_off: number[];
  /** Web Push API subscription — optional, set when user enables notifications */
  push_subscription?: StoredPushSubscription;
  createdAt: Date;
  updatedAt: Date;
}

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const timeValidation = {
  validator: function (v: string) {
    return timeFormatRegex.test(v);
  },
  message: (props: any) => `${props.value} is not a valid time format (HH:MM)!`,
};

const UserSettingsSchema: Schema<IUserSettings> = new Schema(
  {
    wake_time: { type: String, default: '06:00', validate: timeValidation },
    sleep_time: { type: String, default: '22:00', validate: timeValidation },
    leave_time: { type: String, default: '08:30', validate: timeValidation },
    return_time: { type: String, default: '18:00', validate: timeValidation },
    notification_morning: { type: String, default: '06:15', validate: timeValidation },
    notification_night: { type: String, default: '21:30', validate: timeValidation },
    timezone: { type: String, default: 'Asia/Kolkata' },
    pillar_balance_target: {
      money: { type: Number, default: 40, min: 0, max: 100 },
      soul: { type: Number, default: 30, min: 0, max: 100 },
      curiosity: { type: Number, default: 30, min: 0, max: 100 },
    },
    days_off: {
      type: [Number],
      default: [0, 6], // Sunday and Saturday by default
      validate: {
        validator: function (v: number[]) {
          return v.every(day => day >= 0 && day <= 6);
        },
        message: 'Days off must be integers between 0 and 6.',
      },
    },
    overhead_budget_minutes: {
      type: Number,
      default: 30,
      min: 0,
      max: 120,
    },
    // Web Push subscription — stored as nested object, optional
    push_subscription: {
      type: {
        endpoint: { type: String },
        keys: {
          p256dh: { type: String },
          auth: { type: String },
        },
      },
      required: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose Pre-validate hook to ensure the targets sum up to 100
UserSettingsSchema.pre('validate', function () {
  if (this.pillar_balance_target) {
    const { money, soul, curiosity } = this.pillar_balance_target;
    if (money + soul + curiosity !== 100) {
      this.invalidate(
        'pillar_balance_target',
        'Pillar balance targets must sum up exactly to 100'
      );
    }
  }
});

const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings as Model<IUserSettings> ||
  mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

export default UserSettings;
