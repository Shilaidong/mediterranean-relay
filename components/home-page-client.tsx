'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { PageTitle, SectionLabel } from '@/components/page-copy';
import { PrototypeAlbumCard } from '@/components/prototype-album-card';
import type { ListingSummary } from '@/lib/types';

async function readListingsResponse(response: Response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load relay market');
  }
  return (payload.listings ?? []) as ListingSummary[];
}

export function HomePageClient() {
  const pull = useMotionValue(0);
  const labelOpacity = useTransform(pull, [0, 60], [0, 1]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadListings() {
    setFetching(true);
    try {
      const response = await fetch('/api/market/listings', { cache: 'no-store' });
      const nextListings = await readListingsResponse(response);
      setListings(nextListings);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load relay market');
      setListings([]);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void loadListings();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    await loadListings();
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
        {refreshing ? 'Rewinding...' : 'Pull to Refresh'}
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
        <PageTitle english="Relay Home" chinese="真实上架" />

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink" />
          </div>
        ) : (
          <div className="space-y-8 px-6 pb-40">
            {!listings.length ? (
              <div className="py-20 text-center font-serif italic opacity-40">
                {error || '暂无客户上架内容，发布第一张唱片后这里会自动出现'}
              </div>
            ) : (
              <>
                <section>
                  <SectionLabel
                    english="Live Market"
                    chinese="实时市场"
                    count={listings.length.toString().padStart(2, '0')}
                  />
                  <Link
                    href={`/listing/${listings[0].id}`}
                    className="paper-panel block overflow-hidden rounded-[2rem] p-4"
                  >
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-45">
                          Latest Customer Upload · 最新客户上架
                        </p>
                        <h2 className="mt-4 font-serif text-[34px] leading-none tracking-tight">
                          {listings[0].release.title}
                        </h2>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] opacity-45">
                          {listings[0].release.artist} · {listings[0].seller.username}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-ink/10 bg-white/35 px-4 py-2 text-sm font-bold backdrop-blur-md">
                        {listings[0].askingPrice} Cr.
                      </span>
                    </div>
                  </Link>
                </section>

                <section>
                  <SectionLabel
                    english="Customer Uploads"
                    chinese="客户上传"
                    count={listings.length.toString().padStart(2, '0')}
                  />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-12">
                    {listings.map((listing) => (
                      <PrototypeAlbumCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </motion.div>

      <BottomNav />
    </div>
  );
}
