/**
 * taskStore — Zustand store for Task UI state
 *
 * Manages purely client-side UI state:
 *  - which modal is open (add/edit)
 *  - currently selected task for editing
 *  - group-by preference (pillar | flat)
 *  - active filter selections (synced to useTasks hook via prop)
 *
 * Server data (the task list itself) lives in SWR via useTasks.ts.
 * This store is NEVER used for server data — that's the boundary.
 */

import { create } from 'zustand';
import type { Task } from '@/hooks/useTasks';

interface TaskStoreState {
  // Modal state
  isFormOpen: boolean;
  editingTask: Task | null;

  // View preference
  groupBy: 'pillar' | 'flat';

  // Actions
  openCreate: () => void;
  openEdit: (task: Task) => void;
  closeForm: () => void;
  setGroupBy: (groupBy: 'pillar' | 'flat') => void;
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  isFormOpen: false,
  editingTask: null,
  groupBy: 'pillar',

  openCreate: () => set({ isFormOpen: true, editingTask: null }),
  openEdit: (task) => set({ isFormOpen: true, editingTask: task }),
  closeForm: () => set({ isFormOpen: false, editingTask: null }),
  setGroupBy: (groupBy) => set({ groupBy }),
}));
