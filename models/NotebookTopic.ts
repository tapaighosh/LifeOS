import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * NotebookTopic — a top-level container grouping related notebook entries.
 *
 * Each topic has:
 *  - A display `icon` (emoji) and `color` for visual distinction.
 *  - `entry_count` and `last_entry_on` as denormalised stats, updated on write.
 *  - `pinned` to float important topics to the top of the list.
 *  - `active` for soft-delete — user data is never permanently removed.
 */
export type NotebookColor = 'amber' | 'blue' | 'rose' | 'emerald' | 'indigo' | 'zinc';

export interface INotebookTopic extends Document {
  user_id: string;
  title: string;
  icon: string;
  color: NotebookColor;
  entry_count: number;
  last_entry_on: string | null;
  pinned: boolean;
  active: boolean;
  created_at: Date;
}

const NotebookTopicSchema: Schema<INotebookTopic> = new Schema(
  {
    user_id: {
      type: String,
      default: 'default',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [60, 'Title cannot exceed 60 characters'],
    },
    icon: {
      type: String,
      default: '📝',
    },
    color: {
      type: String,
      enum: {
        values: ['amber', 'blue', 'rose', 'emerald', 'indigo', 'zinc'] as NotebookColor[],
        message: '{VALUE} is not a valid color',
      },
      default: 'indigo',
    },
    entry_count: {
      type: Number,
      default: 0,
    },
    last_entry_on: {
      type: String,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // created_at is managed manually (Date.now default) so we only need updatedAt
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

// Compound index: list active topics for a user, pinned first, most recently updated first
NotebookTopicSchema.index({ user_id: 1, pinned: -1, last_entry_on: -1 });

const NotebookTopic: Model<INotebookTopic> =
  mongoose.models.NotebookTopic ||
  mongoose.model<INotebookTopic>('NotebookTopic', NotebookTopicSchema);

export default NotebookTopic;
