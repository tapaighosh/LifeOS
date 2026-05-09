'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [isSundayEvening, setIsSundayEvening] = useState(false);

  useEffect(() => {
    // Check if it's Sunday after 5 PM
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isEvening = now.getHours() >= 17;
    setIsSundayEvening(isSunday && isEvening);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Check-In', href: '/checkin', icon: Sparkles },
    { 
      name: 'Insights', 
      href: '/insights', 
      icon: TrendingUp,
      highlight: isSundayEvening 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 transition-colors",
                isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300",
                item.highlight && !isActive && "text-amber-400 animate-pulse"
              )}
            >
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
              )}
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
