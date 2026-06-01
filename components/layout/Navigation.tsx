'use client';

/**
 * Navigation — Responsive Dual Layout
 *
 * Mobile (< md): 5-item bottom bar — Home · Tasks · Queue · Check-in · Settings
 * Desktop (≥ md): w-48 sidebar — icon + label, all items visible
 *
 * Secondary pages (Challenges, Notebook, Recharge, Insights, Calendar) are
 * reachable from:
 *   - Dashboard quick-action cards (morning dashboard)
 *   - Settings page "All Features" section
 *   - Direct URL navigation
 *
 * WHY two separate render trees instead of one with CSS toggles:
 *   Mobile = horizontal flex row with no labels on overflow items.
 *   Desktop = vertical sidebar with persistent labels. The DOM shape differs
 *   fundamentally — two trees (md:hidden / hidden md:flex) let each layout
 *   own its markup without fighting specificity on every state variant.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
  LayoutDashboard,
  CheckSquare,
  Layers,
  Moon,
  Settings2,
  // Secondary items — shown only in desktop sidebar
  Trophy,
  BookText,
  Zap,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── SWR fetcher ──────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Nav item types ───────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: boolean;
}

// ─── Primary nav items (mobile bar + desktop sidebar) ────────────────────────

const PRIMARY_NAV: NavItem[] = [
  { name: 'Home',      href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks',     href: '/tasks',     icon: CheckSquare },
  { name: 'Queue',     href: '/queues',    icon: Layers },
  { name: 'Check-in',  href: '/checkin',   icon: Moon },
  { name: 'Settings',  href: '/settings',  icon: Settings2 },
];

// ─── Secondary nav items (desktop sidebar only) ───────────────────────────────

const SECONDARY_NAV: NavItem[] = [
  { name: 'Challenges', href: '/challenges', icon: Trophy, badge: true },
  { name: 'Notebook',   href: '/notebook',   icon: BookText },
  { name: 'Recharge',   href: '/recharge',   icon: Zap },
  { name: 'Insights',   href: '/insights',   icon: TrendingUp },
  { name: 'Calendar',   href: '/calendar',   icon: CalendarDays },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

export function Navigation() {
  const pathname = usePathname();

  const { data: challenges } = useSWR<{ status: string }[]>('/api/challenges', fetcher, {
    refreshInterval: 30_000,
  });
  const hasActiveChallenges =
    Array.isArray(challenges) && challenges.some((c) => c.status === 'active');

  // ── Mobile bottom bar (5 primary items, hidden on md+) ────────────────────
  const MobileNav = (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80"
      aria-label="Mobile navigation"
    >
      <div className="h-16 flex items-center justify-around px-1 safe-area-inset-bottom">
        {PRIMARY_NAV.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badge && hasActiveChallenges;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors',
                isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-400" />
              )}

              <span className="relative mb-0.5">
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

  // ── Desktop sidebar (w-48, icon + label, hidden below md) ─────────────────
  const DesktopNav = (
    <nav
      className="hidden md:flex fixed left-0 top-0 h-full w-48 z-50 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/80 flex-col py-5 gap-0.5"
      aria-label="Desktop navigation"
    >
      {/* Logo */}
      <div className="px-4 mb-5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <span className="text-indigo-400 text-xs font-bold">L</span>
        </div>
        <span className="text-sm font-semibold text-zinc-200 tracking-tight">LifeOS</span>
      </div>

      {/* Primary items */}
      <div className="px-2 space-y-0.5">
        <p className="px-2 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Main
        </p>
        {PRIMARY_NAV.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badge && hasActiveChallenges;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-1 ring-zinc-950" />
                )}
              </span>
              <span>{item.name}</span>
              {/* Active left indicator */}
              {isActive && (
                <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-zinc-800/60" />

      {/* Secondary items */}
      <div className="px-2 space-y-0.5 flex-1">
        <p className="px-2 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          More
        </p>
        {SECONDARY_NAV.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badge && hasActiveChallenges;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-1 ring-zinc-950" />
                )}
              </span>
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {MobileNav}
      {DesktopNav}
    </>
  );
}
