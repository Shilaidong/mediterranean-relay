'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { ListingSummary } from '@/lib/types';

export function PrototypeAlbumCard({ listing }: { listing: ListingSummary }) {
  const cover = listing.coverPhotoUrl ?? listing.release.coverUrl ?? '';

  return (
    <Link href={`/listing/${listing.id}`}>
      <motion.div
        layoutId={`card-${listing.id}`}
        whileTap={{ scale: 0.95 }}
        className="flex cursor-pointer flex-col"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(15);
        }}
      >
        <motion.div
          layoutId={`cover-${listing.id}`}
          className="aspect-square rounded-2xl bg-paper p-2 shadow-neumo"
        >
          <div className="h-full w-full overflow-hidden rounded-xl bg-[#d1ccc0]">
            {cover ? (
              <div className="relative h-full w-full">
                <Image
                  src={cover}
                  alt={listing.release.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 240px"
                  className="object-cover opacity-80 mix-blend-multiply"
                />
                {listing.source === 'system' ? (
                  <div className="frost-tag absolute left-2 top-2 rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.26em] text-stamp shadow-neumo-sm">
                    SYSTEM
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>
        <h3 className="mt-4 font-serif text-[18px] leading-none">{listing.release.title}</h3>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-tighter opacity-40">
          {listing.release.artist}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight">{listing.askingPrice} Cr.</span>
          <div className="h-2 w-2 rounded-full border border-ink/30 bg-white shadow-inner" />
        </div>
      </motion.div>
    </Link>
  );
}
