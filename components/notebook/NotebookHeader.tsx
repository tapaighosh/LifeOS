'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import { NewTopicModal } from '@/components/notebook/NewTopicModal';

/**
 * NotebookHeader
 *
 * Client component that owns the "+ New Topic" button and NewTopicModal state.
 * After a topic is created it calls router.refresh() to trigger a server-side
 * re-fetch of the NotebookPage data without a full navigation.
 */
export function NotebookHeader() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreated() {
    // Re-run the server component's data fetch — re-renders the topic list
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Notebook</h1>
        </div>

        <button
          id="new-topic-btn"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
        >
          <Plus className="h-4 w-4" />
          New Topic
        </button>
      </div>

      <NewTopicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
