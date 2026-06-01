/**
 * scripts/seedNotebookTopics.ts
 *
 * Seeds the `notebooktopics` collection with 4 default topics.
 *
 * Idempotent — skips entirely if any topics already exist for user_id 'default'.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seedNotebookTopics.ts
 */

import mongoose from 'mongoose';
import { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Inline model (avoids @/ path-alias issues outside the Next.js bundler)
// ---------------------------------------------------------------------------
interface INotebookTopic extends Document {
  user_id: string;
  title: string;
  icon: string;
  color: string;
  entry_count: number;
  last_entry_on: string | null;
  pinned: boolean;
  active: boolean;
  created_at: Date;
}

const NotebookTopicSchema = new Schema<INotebookTopic>(
  {
    user_id: { type: String, default: 'default' },
    title: { type: String, required: true, trim: true, maxlength: 60 },
    icon: { type: String, default: '📝' },
    color: {
      type: String,
      enum: ['amber', 'blue', 'rose', 'emerald', 'indigo', 'zinc'],
      default: 'indigo',
    },
    entry_count: { type: Number, default: 0 },
    last_entry_on: { type: String, default: null },
    pinned: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);
NotebookTopicSchema.index({ user_id: 1, pinned: -1, last_entry_on: -1 });

const NotebookTopic: Model<INotebookTopic> =
  mongoose.models.NotebookTopic ||
  mongoose.model<INotebookTopic>('NotebookTopic', NotebookTopicSchema);

// ---------------------------------------------------------------------------
// Default topics
// ---------------------------------------------------------------------------
const DEFAULT_TOPICS: Array<{
  title: string;
  icon: string;
  color: string;
  pinned: boolean;
}> = [
  { title: 'Ideas',        icon: '💡', color: 'amber',  pinned: true  },
  { title: 'Learnings',    icon: '📚', color: 'blue',   pinned: true  },
  { title: 'Lines',        icon: '💬', color: 'rose',   pinned: false },
  { title: 'Observations', icon: '🔍', color: 'zinc',   pinned: false },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. ' +
        'Make sure .env.local is loaded before running this script.'
    );
  }

  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
    tls: true,
    retryWrites: true,
  });
  console.log('✅ Connected.');

  // --- Idempotency check ---------------------------------------------------
  const existing = await NotebookTopic.countDocuments({ user_id: 'default' });
  if (existing > 0) {
    console.log(
      `ℹ️  Skipping seed — ${existing} default topic(s) already exist.`
    );
    await mongoose.disconnect();
    return;
  }

  // --- Insert default topics -----------------------------------------------
  const docs = DEFAULT_TOPICS.map((t) => ({
    user_id: 'default',
    title: t.title,
    icon: t.icon,
    color: t.color,
    pinned: t.pinned,
    entry_count: 0,
    last_entry_on: null,
    active: true,
    created_at: new Date(),
  }));

  const result = await NotebookTopic.insertMany(docs);
  console.log(`🌱 Seeded ${result.length} default notebook topic(s) successfully.`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
