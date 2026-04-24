'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { PageTitle, SectionLabel } from '@/components/page-copy';
import type { ProfileResponse } from '@/lib/types';

export function HomePageClient() {
  const pull = useMotionValue(0);
  const labelOpacity = useTransform(pull, [0, 60], [0, 1]);
  const [payload, setPayload] = useState<ProfileResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadProfile() {
    setFetching(true);
    try {
      const response = await fetch('/api/profile/me');
      const nextPayload = await response.json();
      if (!response.ok) {
        throw new Error(nextPayload.error ?? 'Failed to load collection');
      }
      setPayload(nextPayload as ProfileResponse);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    await loadProfile();
    setTimeout(() => {
      setRefreshing(false);
      pull.set(0);
    }, 450);
  }

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar pt-safe">
      <motion.div
        style={{ height: pull, opacity: labelOpacity }}
        className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest opacity-60"
      >
        {refreshing ? 'Rewinding…' : 'Pull to Refresh'}
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={(_, info) => {
          if (info.offset.y > 0) {
            pull.set(Math.min(info.offset.y * 0.5, 80));
          }
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 && !refreshing) {
            void handleRefresh();
          } else {
            pull.set(0);
          }
        }}
      >
        <PageTitle english="My Collection" chinese="个人收藏" />

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink" />
          </div>
        ) : (
          <div className="space-y-8 px-6 pb-40">
            {!payload?.ownedItems.length ? (
              <div className="py-20 text-center font-serif italic opacity-40">
                {error || '暂无收藏，快去逛逛市场吧'}
              </div>
            ) : (
              <section>
                <SectionLabel
                  english="Owned"
                  chinese="已拥有"
                  count={payload.ownedItems.length.toString().padStart(2, '0')}
                />
                <div className="paper-inset p-4">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {payload.ownedItems.map((item) => (
                      <div key={item.id} className="w-36 shrink-0">
                        <Link href="/browse" className="flex flex-col">
                          <div className="paper-panel aspect-square rounded-2xl p-2">
                            <div className="relative h-full w-full overflow-hidden rounded-xl bg-inkSoft">
                              {item.coverPhotoUrl || item.release.coverUrl ? (
                                <Image
                                  src={item.coverPhotoUrl ?? item.release.coverUrl ?? ''}
                                  alt={item.release.title}
                                  fill
                                  sizes="144px"
                                  className="object-cover opacity-80 mix-blend-multiply"
                                />
                              ) : null}
                            </div>
                          </div>
                          <h3 className="mt-4 font-serif text-[18px] leading-none">
                            {item.release.title}
                          </h3>
                          <p className="mt-2 text-[9px] font-bold uppercase tracking-tighter opacity-40">
                            {item.release.artist}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-bold tracking-tight">
                              {item.conditionGrade}
                            </span>
                            <div className="h-2 w-2 rounded-full border border-ink/30 bg-white shadow-inner" />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>

      <BottomNav />
    </div>
  );
}
