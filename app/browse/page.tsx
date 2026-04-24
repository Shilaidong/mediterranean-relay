'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Genre, ListingSummary } from '@/lib/types';
import { RelaySlider } from '@/components/relay-slider';
import { GenreCarousel } from '@/components/genre-carousel';
import { PrototypeAlbumCard } from '@/components/prototype-album-card';
import { FloatingAction } from '@/components/floating-action';
import { BottomNav } from '@/components/bottom-nav';
import { PageTitle } from '@/components/page-copy';
import { systemListings } from '@/lib/system-showcase';

const genres: Array<Genre | 'All'> = ['All', 'Jazz', 'Rock', 'Folk', 'Soul', 'Classical'];
const rarityMin = 12;
const rarityMax = 85;

export default function BrowsePage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genre, setGenre] = useState<Genre | 'All'>('All');
  const [rarity, setRarity] = useState(rarityMax);

  useEffect(() => {
    let active = true;

    fetch('/api/market/listings')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.json()).error ?? 'Failed to load listings');
        }
        return response.json();
      })
      .then((payload) => {
        if (active) {
          setListings(payload.listings ?? []);
          setError('');
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setListings(systemListings);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      listings.filter((listing) => {
        if (genre !== 'All' && listing.release.genre !== genre) {
          return false;
        }
        if (rarity === rarityMax) {
          return true;
        }
        return Math.abs(listing.release.rarity - rarity) <= 40;
      }),
    [genre, listings, rarity],
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <PageTitle english="Mediterranean Relay" chinese="地中海中继站" className="pb-8 pt-12" />

      <div className="mb-4 px-6">
        <RelaySlider min={rarityMin} max={rarityMax} value={rarity} onChange={setRarity} label="Archive Collection" />
      </div>

      <div className="mb-10 px-6">
        <GenreCarousel value={genre} onChange={setGenre} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-ink" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-6 pb-40">
          {filtered.map((listing) => (
            <PrototypeAlbumCard key={listing.id} listing={listing} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-20 text-center font-serif italic opacity-40">
              {error || '暂无匹配此筛选条件的专辑'}
            </div>
          )}
        </div>
      )}

      <FloatingAction />
      <BottomNav />
    </div>
  );
}
