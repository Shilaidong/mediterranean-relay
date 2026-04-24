import Image from 'next/image';
import Link from 'next/link';
import type { ListingSummary } from '@/lib/types';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const cover = listing.coverPhotoUrl ?? listing.release.coverUrl ?? '';

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="paper-panel flex flex-col overflow-hidden rounded-[26px]"
    >
      <div className="relative aspect-square bg-inkSoft/40">
        {cover ? (
          <Image
            src={cover}
            alt={listing.release.title}
            fill
            sizes="(max-width: 768px) 50vw, 320px"
            className="object-cover mix-blend-multiply"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-paper/55 via-transparent to-transparent" />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-ink/45">
            {listing.release.artist} · {listing.release.year}
          </p>
          <h3 className="mt-2 font-serif text-[22px] leading-tight">
            {listing.release.title}
          </h3>
        </div>
        <p className="min-h-10 text-sm leading-6 text-ink/65">
          {listing.headline ?? 'Relay-listed archive piece'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="rounded-full bg-paper px-3 py-1 shadow-neumo-inset">
            {listing.inventory.conditionGrade}
          </span>
          <span className="font-semibold text-stamp">{listing.askingPrice} Cr.</span>
        </div>
      </div>
    </Link>
  );
}
