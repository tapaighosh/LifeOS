'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Book, CheckCircle, SlidersHorizontal } from 'lucide-react';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import ChallengeLibraryItem from '@/components/challenges/ChallengeLibraryItem';
import AcceptChallengeDrawer from '@/components/challenges/AcceptChallengeDrawer';
import { LibraryChallenge } from '@/lib/challenges/library';
import { IChallenge } from '@/models/Challenge';

type Tab = 'active' | 'library' | 'completed';

const CATEGORY_FILTERS = ['all', 'physical', 'mental', 'financial', 'social', 'creative'] as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 p-5 bg-zinc-900/50 animate-pulse space-y-3">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-full" />
      <div className="h-2 bg-zinc-800 rounded-full w-full" />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'active',    label: 'Active',    icon: <Trophy className="h-4 w-4" /> },
  { id: 'library',   label: 'Library',   icon: <Book className="h-4 w-4" /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [challenges, setChallenges] = useState<IChallenge[]>([]);
  const [library, setLibrary] = useState<(LibraryChallenge & { already_accepted?: boolean })[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [drawerItem, setDrawerItem] = useState<LibraryChallenge | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoadingChallenges(true);
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) setChallenges(await res.json());
    } finally {
      setLoadingChallenges(false);
    }
  }, []);

  const fetchLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const url = categoryFilter !== 'all'
        ? `/api/challenges/library?category=${categoryFilter}`
        : '/api/challenges/library';
      const res = await fetch(url);
      if (res.ok) setLibrary(await res.json());
    } finally {
      setLoadingLibrary(false);
    }
  }, [categoryFilter]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);
  useEffect(() => { if (tab === 'library') fetchLibrary(); }, [tab, fetchLibrary]);

  const activeChallenges   = challenges.filter((c) => c.status === 'active');
  const completedChallenges = challenges.filter((c) => c.status === 'completed');

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 md:pl-16">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Challenges
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            30 and 90-day commitments that build your character.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 rounded-2xl p-1 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200
                ${tab === t.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300'}
              `}
            >
              {t.icon}
              {t.label}
              {t.id === 'active' && activeChallenges.length > 0 && (
                <span className="bg-white/20 text-white rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {activeChallenges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Active tab ── */}
        {tab === 'active' && (
          <div className="space-y-3">
            {loadingChallenges
              ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
              : activeChallenges.length === 0
              ? (
                <div className="text-center py-16">
                  <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No active challenges.</p>
                  <button
                    onClick={() => setTab('library')}
                    className="mt-3 text-indigo-400 text-sm hover:underline"
                  >
                    Browse the library →
                  </button>
                </div>
              )
              : activeChallenges.map((c) => (
                <ChallengeCard key={String(c._id)} challenge={c} />
              ))
            }
          </div>
        )}

        {/* ── Library tab ── */}
        {tab === 'library' && (
          <div>
            {/* Category filter */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
              <SlidersHorizontal className="h-4 w-4 text-zinc-500 shrink-0" />
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}
                  `}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {loadingLibrary
                ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                : library.map((item) => (
                  <ChallengeLibraryItem
                    key={item.id}
                    item={item}
                    onAccept={setDrawerItem}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* ── Completed tab ── */}
        {tab === 'completed' && (
          <div className="space-y-3">
            {loadingChallenges
              ? Array.from({ length: 1 }).map((_, i) => <CardSkeleton key={i} />)
              : completedChallenges.length === 0
              ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">
                    No completed challenges yet. Keep going!
                  </p>
                </div>
              )
              : completedChallenges.map((c) => (
                <ChallengeCard key={String(c._id)} challenge={c} />
              ))
            }
          </div>
        )}
      </div>

      {/* Accept drawer */}
      {drawerItem && (
        <AcceptChallengeDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          onSuccess={() => {
            fetchChallenges();
            fetchLibrary();
          }}
        />
      )}
    </div>
  );
}
