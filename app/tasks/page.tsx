import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TasksClientPage } from '@/components/tasks/TasksClientPage';

export const metadata = {
  title: 'Task Master List — LifeOS',
  description: 'Manage all your recurring, one-time, project, and recharge tasks across your three life pillars.',
};

/**
 * /tasks — Task Management Page (Server Component shell)
 *
 * Handles auth guard server-side (no flicker).
 * Renders the interactive TasksClientPage as a client subtree.
 */
export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  return <TasksClientPage />;
}
