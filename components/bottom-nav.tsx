'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Users, User } from 'lucide-react';

const tabs = [
  { href: '/home', label: 'HOME', icon: Home },
  { href: '/browse', label: 'BROWSE', icon: Search },
  { href: '/community', label: 'COMMUNITY', icon: Users },
  { href: '/profile', label: 'PROFILE', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-bar fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-8 pt-4 pb-safe">
      <div className="flex h-12 items-center justify-between">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (navigator.vibrate) {
                  navigator.vibrate(12);
                }
              }}
              className={`flex min-w-[56px] flex-col items-center transition-opacity ${
                active ? 'opacity-100' : 'opacity-35'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className="text-ink"
              />
              <span className="mt-1 text-[8px] font-bold tracking-widest text-ink">
                {label}
              </span>
              {active ? <div className="mt-1 h-1 w-1 rounded-full bg-ink" /> : <div className="mt-1 h-1 w-1 opacity-0" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
