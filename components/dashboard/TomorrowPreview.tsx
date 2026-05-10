'use client';

import Link from 'next/link';
import { Clock, BarChart2 } from 'lucide-react';

interface TomorrowTask {
  _id: string;
  title: string;
  pillar: 'money' | 'soul' | 'curiosity';
  duration: number;
  priority: number;
}

const PILLAR_BADGE: Record<string, string> = {
  money:     'bg-amber-500/15 text-amber-400',
  soul:      'bg-rose-500/15 text-rose-400',
  curiosity: 'bg-blue-500/15 text-blue-400',
};

const PILLAR_EMOJI: Record<string, string> = {
  money: '💰', soul: '🔥', curiosity: '🧠',
};

interface Props {
  tasks: TomorrowTask[];
}

export default function TomorrowPreview({ tasks }: Props) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-4 w-4 text-zinc-500" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tomorrow Preview</h3>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="flex items-center gap-3 py-2 border-b border-zinc-800/40 last:border-0"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PILLAR_BADGE[task.pillar]}`}>
              {PILLAR_EMOJI[task.pillar]}
            </span>
            <span className="flex-1 text-sm text-zinc-200 truncate">{task.title}</span>
            <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
              <Clock className="h-3 w-3" />
              {task.duration}m
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/tasks"
        className="mt-3 block text-center text-xs text-indigo-400 hover:underline"
      >
        View all tasks →
      </Link>
    </div>
  );
}
