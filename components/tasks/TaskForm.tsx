'use client';

/**
 * TaskForm — modal form for creating and editing tasks.
 *
 * Uses native form handling with controlled inputs (no external form library).
 * Validates locally by re-using the taskCreateSchema / taskUpdateSchema from Zod
 * and displays field-level errors.
 *
 * Pre-fills all fields when editingTask is provided (edit mode).
 * Calls onSubmit with the validated payload, which invokes the SWR CRUD helper.
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { taskCreateSchema, taskUpdateSchema } from '@/lib/validators/task';
import type { Task, TaskCreate, TaskUpdate } from '@/hooks/useTasks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: Task | null;
  onSubmit: (data: TaskCreate | TaskUpdate, id?: string) => Promise<void>;
}

type FormErrors = Partial<Record<keyof TaskCreate, string>>;

// ─── Default Values ───────────────────────────────────────────────────────────

const DEFAULTS: TaskCreate = {
  title: '',
  pillar: 'money',
  category: '',
  type: 'recurring',
  duration: 30,
  energy_cost: 'medium',
  slot_preference: 'any',
  frequency: 'daily',
  revision: false,
  revision_cycle: [1, 3, 7, 14],
  priority: 3,
  notes: '',
  active: true,
};

// ─── Field Helpers ────────────────────────────────────────────────────────────

const PILLAR_OPTIONS = [
  { value: 'money', label: '💰 Money Making' },
  { value: 'soul', label: '🔥 For My Soul' },
  { value: 'curiosity', label: '🧠 For My Curiosity' },
] as const;

const TYPE_OPTIONS = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'one-time', label: 'One-time' },
  { value: 'project', label: 'Project' },
  { value: 'recharge', label: '⚡ Recharge' },
] as const;

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
const ENERGY_OPTIONS = ['high', 'medium', 'low'] as const;
const SLOT_OPTIONS = ['morning', 'evening', 'any'] as const;
const FREQUENCY_OPTIONS = ['daily', 'alternate', '3x_week', 'weekly', 'custom'] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

function Field({ label, error, required, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-400 tracking-wide">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

const inputClass = cn(
  'w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100',
  'placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500',
  'transition-colors duration-150'
);

const selectClass = cn(inputClass, 'appearance-none cursor-pointer');

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskForm({ isOpen, onClose, editingTask, onSubmit }: TaskFormProps) {
  const isEdit = !!editingTask;
  const [form, setForm] = useState<TaskCreate>(DEFAULTS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        pillar: editingTask.pillar,
        category: editingTask.category ?? '',
        type: editingTask.type,
        duration: editingTask.duration,
        energy_cost: editingTask.energy_cost,
        slot_preference: editingTask.slot_preference,
        frequency: editingTask.frequency,
        revision: editingTask.revision,
        revision_cycle: editingTask.revision_cycle ?? [1, 3, 7, 14],
        priority: editingTask.priority,
        notes: editingTask.notes ?? '',
        active: editingTask.active,
      });
    } else {
      setForm(DEFAULTS);
    }
    setErrors({});
    setSubmitError(null);
  }, [editingTask, isOpen]);

  // Recharge duration constraint: auto-clamp to 15 when type switches to recharge
  const handleTypeChange = (type: TaskCreate['type']) => {
    setForm((prev) => ({
      ...prev,
      type,
      duration: type === 'recharge' && prev.duration > 15 ? 15 : prev.duration,
    }));
  };

  const set = <K extends keyof TaskCreate>(key: K, value: TaskCreate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side Zod validation
    const schema = isEdit ? taskUpdateSchema : taskCreateSchema;
    const result = schema.safeParse(form);

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const mapped: FormErrors = {};
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs && msgs.length > 0) {
          mapped[key as keyof TaskCreate] = msgs[0];
        }
      }
      setErrors(mapped);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(result.data, isEdit ? editingTask!._id : undefined);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Task` : 'New Task'}
      className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-zinc-900"
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Field label="Title" required error={errors.title} htmlFor="task-title">
          <input
            id="task-title"
            type="text"
            className={inputClass}
            placeholder="e.g. DSA practice"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={200}
          />
        </Field>

        {/* Pillar + Category row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pillar" required error={errors.pillar} htmlFor="task-pillar">
            <select
              id="task-pillar"
              className={selectClass}
              value={form.pillar}
              onChange={(e) => set('pillar', e.target.value as TaskCreate['pillar'])}
            >
              {PILLAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" error={errors.category} htmlFor="task-category">
            <input
              id="task-category"
              type="text"
              className={inputClass}
              placeholder="e.g. Interviews"
              value={form.category ?? ''}
              onChange={(e) => set('category', e.target.value)}
              maxLength={100}
            />
          </Field>
        </div>

        {/* Type + Duration row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required error={errors.type} htmlFor="task-type">
            <select
              id="task-type"
              className={selectClass}
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as TaskCreate['type'])}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Duration (minutes)" required error={errors.duration} htmlFor="task-duration">
            <select
              id="task-duration"
              className={selectClass}
              value={form.duration}
              onChange={(e) => set('duration', Number(e.target.value) as TaskCreate['duration'])}
            >
              {DURATION_OPTIONS
                .filter((d) => form.type !== 'recharge' || d <= 15)
                .map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
            </select>
            {form.type === 'recharge' && (
              <p className="text-xs text-amber-400 mt-1">Recharge tasks are capped at 15 min</p>
            )}
          </Field>
        </div>

        {/* Energy + Slot row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Energy Cost" required error={errors.energy_cost} htmlFor="task-energy">
            <select
              id="task-energy"
              className={selectClass}
              value={form.energy_cost}
              onChange={(e) => set('energy_cost', e.target.value as TaskCreate['energy_cost'])}
            >
              {ENERGY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Slot Preference" error={errors.slot_preference} htmlFor="task-slot">
            <select
              id="task-slot"
              className={selectClass}
              value={form.slot_preference}
              onChange={(e) => set('slot_preference', e.target.value as TaskCreate['slot_preference'])}
            >
              {SLOT_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Frequency + Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frequency" error={errors.frequency} htmlFor="task-frequency">
            <select
              id="task-frequency"
              className={selectClass}
              value={form.frequency ?? ''}
              onChange={(e) =>
                set('frequency', (e.target.value || undefined) as TaskCreate['frequency'])
              }
            >
              <option value="">— none —</option>
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <Field label="Priority (1–5)" required error={errors.priority} htmlFor="task-priority">
            <div className="flex items-center gap-2">
              <input
                id="task-priority"
                type="range"
                min={1}
                max={5}
                step={1}
                value={form.priority}
                onChange={(e) => set('priority', Number(e.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="text-sm font-bold text-amber-400 w-4 text-center">
                {form.priority}
              </span>
            </div>
          </Field>
        </div>

        {/* Revision toggle */}
        <div className="flex items-center gap-3">
          <button
            id="task-revision-toggle"
            type="button"
            role="switch"
            aria-checked={form.revision}
            onClick={() => set('revision', !form.revision)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              form.revision ? 'bg-indigo-500' : 'bg-zinc-700'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                form.revision ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <label htmlFor="task-revision-toggle" className="text-sm text-zinc-400 cursor-pointer">
            Enable spaced repetition revision
          </label>
        </div>

        {/* Notes */}
        <Field label="Notes" error={errors.notes} htmlFor="task-notes">
          <textarea
            id="task-notes"
            className={cn(inputClass, 'resize-none')}
            rows={3}
            placeholder="Optional context or links..."
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            maxLength={1000}
          />
        </Field>

        {/* Server error */}
        {submitError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <Button
            id="task-form-cancel"
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            id="task-form-submit"
            type="submit"
            variant="default"
            disabled={submitting}
            className="min-w-24"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Task'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
