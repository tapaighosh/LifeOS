/**
 * /queues — Queue overview page (Server Component)
 *
 * Fetches all active queues with progress server-side.
 * Shows 5 pre-seeded queue cards on first load.
 * "+ New Queue" button opens a create modal.
 */

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import TopicQueue from '@/models/TopicQueue';
import TopicItem from '@/models/TopicItem';
import { QueueCard } from '@/components/queues/QueueCard';
import { BookOpen } from 'lucide-react';

async function getQueuesWithProgress() {
  await connectDB();
  const queues = await TopicQueue.find({ active: true }).lean();

  return Promise.all(
    queues.map(async (queue) => {
      const [covered, pending, skipped, inProgress] = await Promise.all([
        TopicItem.countDocuments({ queue_id: queue._id, status: 'covered' }),
        TopicItem.countDocuments({ queue_id: queue._id, status: 'pending' }),
        TopicItem.countDocuments({ queue_id: queue._id, status: 'skipped' }),
        TopicItem.countDocuments({ queue_id: queue._id, status: 'in_progress' }),
      ]);

      return {
        queue: { ...queue, _id: queue._id.toString() },
        progress: { covered, pending, skipped, in_progress: inProgress, total: covered + pending + skipped + inProgress },
      };
    })
  );
}

export const metadata = {
  title: 'My Topic Queues | LifeOS',
  description: 'Structured learning — one topic at a time.',
};

export default async function QueuesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const queueData = await getQueuesWithProgress();

  const totalCovered = queueData.reduce((sum, q) => sum + q.progress.covered, 0);
  const totalTopics = queueData.reduce((sum, q) => sum + q.progress.total, 0);

  return (
    <main className="max-w-2xl mx-auto pb-28 px-4 pt-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">My Topic Queues</h1>
          </div>
          <p className="text-zinc-500 text-sm">One topic at a time.</p>
          {totalTopics > 0 && (
            <p className="text-zinc-600 text-xs mt-1">
              {totalCovered} / {totalTopics} topics covered across all queues
            </p>
          )}
        </div>
      </header>

      {/* Queue list */}
      {queueData.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No queues yet.</p>
          <p className="text-xs mt-1 text-zinc-700">Queues will be seeded on next page refresh.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueData.map(({ queue, progress }) => (
            <QueueCard
              key={queue._id}
              queue={queue as any}
              progress={progress}
            />
          ))}
        </div>
      )}
    </main>
  );
}
