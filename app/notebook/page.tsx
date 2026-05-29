import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import NotebookTopic, { INotebookTopic } from '@/models/NotebookTopic';
import { NotebookTopicCard } from '@/components/notebook/NotebookTopicCard';
import { NotebookHeader } from '@/components/notebook/NotebookHeader';

export const metadata = {
  title: 'Notebook — LifeOS',
  description: 'Your personal knowledge base. Capture ideas, learnings, quotes, and observations.',
};

/**
 * /notebook — Notebook index (Server Component)
 *
 * Server-side auth guard + direct DB fetch for instant streaming.
 * The interactive "+ New Topic" button lives in NotebookHeader (client component)
 * which calls router.refresh() after creation to reload this server data.
 */
export default async function NotebookPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  await connectDB();

  const topics = await NotebookTopic.find({
    active: true,
    user_id: 'default',
  })
    .sort({ pinned: -1, last_entry_on: -1 })
    .lean() as unknown as INotebookTopic[];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

        {/* ── Header + New Topic button ── */}
        <NotebookHeader />

        {/* ── Topic list ── */}
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-4">📓</p>
            <p className="text-sm text-zinc-400 font-medium">
              Your notebook is empty.
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Create your first topic to start capturing ideas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((topic) => (
              <NotebookTopicCard
                key={String(topic._id)}
                topic={topic}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
