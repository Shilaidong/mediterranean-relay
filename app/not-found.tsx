import Link from 'next/link';
import { AppShell } from '@/components/app-shell';

export default function NotFound() {
  return (
    <AppShell title="Not Found" eyebrow="Relay Signal Lost" showNav={false}>
      <div className="page-padding">
        <div className="paper-panel p-6 text-center">
          <p className="font-serif text-[28px]">This relay page is missing.</p>
          <p className="mt-4 text-sm leading-7 text-ink/60">
            The record may have been sold, moved, or never published into the new Supabase project.
          </p>
          <Link
            href="/browse"
            className="chrome-button-primary mt-6 inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold uppercase tracking-[0.28em] text-paper"
          >
            Return to Browse
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
