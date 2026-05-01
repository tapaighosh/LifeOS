'use client';

/**
 * TasksClientPage — interactive shell for /tasks
 *
 * Orchestrates:
 *  - useTasks SWR hook (data + CRUD)
 *  - useTaskStore Zustand store (modal state, groupBy)
 *  - TaskFilters, TaskList, TaskForm components
 *
 * Layout:
 *  - Page header with title, task count, and "Add Task" button
 *  - View toggle (Grouped by Pillar | Flat list)
 *  - TaskFilters bar
 *  - TaskList grid
 *  - TaskForm modal (overlay)
 */

import { useCallback } from 'react';
import { Plus, LayoutGrid, List, Target } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStore } from '@/stores/taskStore';
import { TaskList } from './TaskList';
import { TaskFilters } from './TaskFilters';
import { TaskForm } from './TaskForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Task, TaskCreate, TaskUpdate } from '@/hooks/useTasks';

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksClientPage() {
  const { isFormOpen, editingTask, groupBy, openCreate, openEdit, closeForm, setGroupBy } =
    useTaskStore();

  const { tasks, isLoading, error, filters, setFilters, createTask, updateTask, deleteTask } =
    useTasks();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleEdit = useCallback(
    (task: Task) => {
      openEdit(task);
    },
    [openEdit]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTask(id);
    },
    [deleteTask]
  );

  const handleSubmit = useCallback(
    async (data: TaskCreate | TaskUpdate, id?: string) => {
      if (id) {
        await updateTask(id, data as TaskUpdate);
      } else {
        await createTask(data as TaskCreate);
      }
    },
    [createTask, updateTask]
  );

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-rose-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-700">
              <Target className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Task Master List</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isLoading ? (
                  '...'
                ) : (
                  <>
                    {tasks.length} active task{tasks.length !== 1 ? 's' : ''} across 3 pillars
                  </>
                )}
              </p>
            </div>
          </div>

          <Button
            id="add-task-btn"
            variant="default"
            onClick={openCreate}
            className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>

        {/* ── Controls bar ────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 mb-6">
          {/* View toggle */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-zinc-800/60 border border-zinc-800 shrink-0"
            role="group"
            aria-label="View mode"
          >
            <button
              id="view-grouped"
              onClick={() => setGroupBy('pillar')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                groupBy === 'pillar'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grouped</span>
            </button>
            <button
              id="view-flat"
              onClick={() => setGroupBy('flat')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                groupBy === 'flat'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Flat</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex-1 min-w-0">
            <TaskFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Active filter count badge */}
          {activeFiltersCount > 0 && (
            <button
              id="clear-filters-btn"
              onClick={() => setFilters({})}
              className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors mt-1"
            >
              Clear ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* ── Task Grid ───────────────────────────────────────────────────── */}
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          error={error}
          groupBy={groupBy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Task Form Modal ──────────────────────────────────────────────── */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={closeForm}
        editingTask={editingTask}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
