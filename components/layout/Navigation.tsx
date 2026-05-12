'use client';

/**
 * Navigation — Responsive Dual Layout
 *
 * WHY TWO SEPARATE RENDER TREES instead of one element with CSS transforms:
 *   The mobile bar (bottom, horizontal) and desktop sidebar (left, vertical) have
 *   fundamentally different DOM structures — a horizontal flex row vs a vertical flex
 *   column with a border indicator, different padding, and different interaction models
 *   (label visible on mobile, tooltip-only on desktop). Forcing them into a single tree
 *   with class toggles would mean rendering hidden elements on both viewports and
 *   fighting CSS specificity for every state variant.
 *
 *   Two trees (md:hidden / hidden md:flex) let each layout own its markup cleanly.
 *   The breakpoint logic is compile-time Tailwind — no JS involved in the switch.
 *
 * WHY setInterval FOR SUNDAY CHECK instead of checking once on mount:
 *   If a user leaves the app open across the Sunday 5 PM boundary, a one-time mount
 *   check would never re-evaluate. The interval polls every 60 s and clears on unmount
 *   to avoid memory leaks.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
  LayoutDashboard,
  CheckSquare,
  Trophy,
  BookOpen,
  Sparkles,
  TrendingUp,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── SWR fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Nav items definition ─────────────────────────────────────────────────────

function useNavItems(isSundayEvening: boolean) {
  return [
    { name: 'Home',       href: '/dashboard',  icon: LayoutDashboard, highlight: false },
    { name: 'Tasks',      href: '/tasks',       icon: CheckSquare,     highlight: false },
    { name: 'Challenges', href: '/challenges',  icon: Trophy,          highlight: false, badge: true },
    { name: 'Queues',     href: '/queues',      icon: BookOpen,        highlight: false },
    { name: 'Check-In',   href: '/checkin',     icon: Sparkles,        highlight: false },
    { name: 'Insights',   href: '/insights',    icon: TrendingUp,      highlight: isSundayEvening },
    { name: 'Settings',   href: '/settings',    icon: Settings2,       highlight: false },
  ] as const;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export function Navigation() {
  const pathname = usePathname();
  const [isSundayEvening, setIsSundayEvening] = useState(false);

  // Live Sunday-evening check — re-evaluates every 60 s
  useEffect(() => {
    function check() {
      const now = new Date();
      setIsSundayEvening(now.getDay() === 0 && now.getHours() >= 17);
    }
    check(); // run immediately on mount
    const id = setInterval(check, 60_000);
    return () => clearInterval(id); // cleanup on unmount
  }, []);

  // Active challenge count for badge
  const { data: challenges } = useSWR<{ status: string }[]>('/api/challenges', fetcher, {
    refreshInterval: 30_000, // re-check every 30 s
  });
  const hasActiveChallenges = Array.isArray(challenges) && challenges.some((c) => c.status === 'active');

  const navItems = useNavItems(isSundayEvening);

  // ── Mobile bottom bar (hidden on md+) ──────────────────────────────────────
  const MobileNav = (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800"
      aria-label="Mobile navigation"
    >
      <div className="h-16 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = 'badge' in item && item.badge && hasActiveChallenges;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-12 h-12 transition-colors',
                isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300',
                item.highlight && !isActive && 'text-amber-400 animate-pulse'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
              )}

              {/* Icon + challenge badge */}
              <span className="relative mb-1">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
                )}
              </span>

              <span className="text-[10px] font-medium tracking-wide leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // ── Desktop sidebar (hidden below md) ──────────────────────────────────────
  const DesktopNav = (
    <nav
      className="hidden md:flex fixed left-0 top-0 h-full w-16 z-50 bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800 flex-col items-center py-6 gap-1"
      aria-label="Desktop navigation"
    >
      {/* Logo mark */}
      <div className="mb-4 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
        <span className="text-indigo-400 text-xs font-bold">L</span>
      </div>

      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const showBadge = 'badge' in item && item.badge && hasActiveChallenges;

        return (
          <div key={item.name} className="relative w-full flex justify-center">
            {/* Active left-border indicator */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-400 rounded-r-full" />
            )}

            <Link
              href={item.href}
              title={item.name}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300',
                item.highlight && !isActive && 'text-amber-400 ring-1 ring-amber-400/30'
              )}
            >
              <Icon className="w-5 h-5" />

              {/* Challenge badge dot */}
              {showBadge && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-1 ring-zinc-950" />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {MobileNav}
      {DesktopNav}
    </>
  );
}
