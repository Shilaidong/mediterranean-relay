'use client';

import { Disc3 } from 'lucide-react';
import type { Genre } from '@/lib/types';

type Props = {
  value: Genre | 'All';
  onChange: (value: Genre | 'All') => void;
};

const GENRES: Array<Genre | 'All'> = ['All', 'Jazz', 'Rock', 'Folk', 'Soul', 'Classical'];

export function GenreCarousel({ value, onChange }: Props) {
  const handleSelect = (genre: Genre | 'All') => {
    if (genre === value) return;
    if (navigator.vibrate) navigator.vibrate(15);
    onChange(genre);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="shrink-0 text-[12px] font-serif italic opacity-60">Style · 风格</span>
      <div className="ml-6 flex-1 overflow-x-auto no-scrollbar rounded-full bg-paper px-2 shadow-neumo-inset">
        <div className="flex h-10 min-w-max items-center gap-1">
          {GENRES.map((genre) => {
            const active = genre === value;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => handleSelect(genre)}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 ${
                  active
                    ? 'bg-ink text-paper shadow-neumo-sm'
                    : 'bg-transparent text-ink/60'
                }`}
              >
                <Disc3
                  size={12}
                  strokeWidth={1.5}
                  className={active ? 'opacity-90' : 'opacity-40'}
                />
                <span className="whitespace-nowrap text-[11px] font-bold tracking-wide">
                  {genre}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
