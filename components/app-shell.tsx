import type { ReactNode } from 'react';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({
  children,
  title,
  eyebrow,
  showNav = true,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
  showNav?: boolean;
}) {
  return (
    <div className="shell safe-top">
      <main className="relative z-10 flex-1">
        <header className="px-5 pt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-ink/45">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-[34px] leading-none text-ink">
            {title}
          </h1>
        </header>
        {children}
      </main>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
