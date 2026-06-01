import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * NotebookEntry — an individual note stored under a NotebookTopic.
 *
 * `body` holds the main text content (max 5 000 chars).
 * `source` is an optional attribution string (book name, URL, person, etc.).
 * `tags` are a flat list of up to 5 freeform labels for cross-topic search.
 * `created_at` is immutable — entries are never edited in place.
 */
export interface INotebookEntry extends Document {
  topic_id: Types.ObjectId;
  body: string;
  source: string;
  tags: string[];
  created_at: Date;
}

const NotebookEntrySchema: Schema<INotebookEntry> = new Schema(
  {
    topic_id: {
      type: Schema.Types.ObjectId,
      ref: 'NotebookTopic',
      required: [true, 'topic_id is required'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: [5000, 'Body cannot exceed 5 000 characters'],
    },
    source: {
      type: String,
      trim: true,
      maxlength: [100, 'Source cannot exceed 100 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'A note can have at most 5 tags',
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // created_at is managed manually; only track updatedAt for completeness
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

// Primary query pattern: fetch all entries for a topic, newest first
NotebookEntrySchema.index({ topic_id: 1, created_at: -1 });

const NotebookEntry: Model<INotebookEntry> =
  mongoose.models.NotebookEntry ||
  mongoose.model<INotebookEntry>('NotebookEntry', NotebookEntrySchema);

export default NotebookEntry;
