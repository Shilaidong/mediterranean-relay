'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Pause, Play } from 'lucide-react';
import { HapticTap } from '@/components/haptic-tap';
import { useAuth } from '@/providers/auth-provider';
import type { ListingSummary } from '@/lib/types';
import { getSystemListingById } from '@/lib/system-showcase';

export function ListingDetailPage({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hoverNote, setHoverNote] = useState<number | null>(null);
  const [levels, setLevels] = useState<[number, number]>([0.2, 0.2]);
  const [error, setError] = useState('');
  const rotateY = useMotionValue(0);
  const frontOpacity = useTransform(rotateY, [-90, 0, 90], [0, 1, 0]);
  const backOpacity = useTransform(rotateY, [90, 180, 270], [0, 1, 0]);

  useEffect(() => {
    if (!playing) {
      setLevels([0.1, 0.1]);
      return;
    }
    const interval = setInterval(() => {
      setLevels([0.4 + Math.random() * 0.6, 0.3 + Math.random() * 0.6]);
    }, 120);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/market/listings/${listingId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.json()).error ?? 'Failed to load listing');
        }
        return response.json();
      })
      .then((payload) => {
        if (active) {
          setListing(payload.listing as ListingSummary);
          setError('');
        }
      })
      .catch((err: Error) => {
        if (active) {
          const systemListing = getSystemListingById(listingId);
          if (systemListing) {
            setListing(systemListing);
            setError('');
          } else {
            setError(err.message);
          }
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
  }, [listingId]);

  async function handlePurchase() {
    if (!user) {
      router.push(`/login?next=/listing/${listingId}`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Purchase failed');
      }

      await refreshProfile();
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <div className="flex items-center justify-between px-6 pt-6">
        <HapticTap
          onClick={() => router.back()}
          className="paper-inset flex h-11 w-11 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
          Mechanical Stand
        </span>
        <div className="h-11 w-11" />
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 size={24} className="animate-spin text-ink" />
        </div>
      ) : !listing ? (
        <div className="flex h-full items-center justify-center">
          <p className="font-serif italic opacity-60">{error || '未找到此专辑'}</p>
        </div>
      ) : (
        <>
          <div className="perspective-1000 mt-10 px-10">
            <motion.div
              className="relative aspect-square cursor-grab preserve-3d active:cursor-grabbing"
              style={{ rotateY }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDrag={(_, info) => {
                rotateY.set(rotateY.get() + info.delta.x * 0.8);
              }}
              onDragEnd={() => {
                const current = rotateY.get();
                const snap = Math.round(current / 180) * 180;
                animate(rotateY, snap, {
                  type: 'spring',
                  stiffness: 120,
                  damping: 16,
                });
              }}
            >
              <motion.div
                style={{ opacity: frontOpacity }}
                className="paper-panel absolute inset-0 rounded-2xl p-2 backface-hidden"
              >
                <div className="h-full w-full overflow-hidden rounded-xl bg-inkSoft">
                  <Image
                    src={listing.coverPhotoUrl ?? listing.release.coverUrl ?? ''}
                    alt={listing.release.title}
                    width={800}
                    height={800}
                    className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                  />
                </div>
              </motion.div>
              <motion.div
                style={{ opacity: backOpacity, rotateY: 180 }}
                className="paper-panel absolute inset-0 rounded-2xl p-4 backface-hidden"
              >
                <div className="flex h-full flex-col rounded-xl border border-ink/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                    Tracklist · Side A/B
                  </p>
                  <div className="mt-4 flex-1 space-y-2 overflow-auto no-scrollbar">
                    {listing.release.tracklist.map((track, index) => (
                      <div
                        key={`${track.name}-${index}`}
                        className="flex justify-between text-[13px] font-serif"
                      >
                        <span>
                          {String(index + 1).padStart(2, '0')}. {track.name}
                        </span>
                        <span className="opacity-50">{track.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-widest opacity-30">
              左右拖拽 · 翻转查看背面
            </p>
          </div>

          <div className="mt-10 px-8">
            <h2 className="font-serif text-[32px] leading-none">{listing.release.title}</h2>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest opacity-40">
              {listing.release.artist} · {listing.release.year}
            </p>
          </div>

          <div className="mt-10 px-6">
            <div className="paper-inset flex items-center gap-4 rounded-2xl px-5 py-4">
              <HapticTap
                onClick={() => setPlaying((previous) => !previous)}
                className="chrome-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              >
                {playing ? (
                  <Pause size={18} className="text-ink" />
                ) : (
                  <Play size={18} className="ml-0.5 text-ink" />
                )}
              </HapticTap>
              <div className="flex flex-1 flex-col gap-2">
                {levels.map((level, index) => (
                  <div key={index} className="h-2 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      animate={{ width: `${level * 100}%` }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-ink to-stamp"
                    />
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-bold tracking-widest opacity-40">VU</span>
            </div>
          </div>

          <div className="mt-8 px-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                Wear Report
              </p>
              <span className="text-[11px] font-bold tracking-wider">
                {listing.inventory.conditionGrade}
              </span>
            </div>
            <div className="paper-inset relative aspect-square overflow-hidden rounded-2xl">
              <svg className="absolute inset-0 h-full w-full opacity-20">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#1A4B9E"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div className="absolute inset-8 rounded-full border border-ink/30" />
              <div className="absolute inset-[35%] rounded-full border border-ink/40" />
              {listing.inventory.conditionNotes.map((note, index) => (
                <button
                  key={index}
                  onMouseEnter={() => setHoverNote(index)}
                  onMouseLeave={() => setHoverNote(null)}
                  onClick={() => setHoverNote(index === hoverNote ? null : index)}
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stamp/80 shadow-md"
                  style={{
                    left: `${25 + ((index * 19) % 48)}%`,
                    top: `${35 + ((index * 17) % 32)}%`,
                  }}
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-stamp/40" />
                </button>
              ))}
              {hoverNote !== null ? (
                <div className="frost-tag absolute bottom-4 left-4 right-4 rounded-lg px-3 py-2 font-serif text-[12px] italic shadow-neumo-sm">
                  {listing.inventory.conditionNotes[hoverNote].label}
                </div>
              ) : null}
              {listing.inventory.conditionNotes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest opacity-40">
                    No Defects
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {error ? <p className="mt-4 text-center text-[12px] text-stamp">{error}</p> : null}

          <div className="mt-8 px-6 pb-40">
            <HapticTap
              onClick={handlePurchase}
              disabled={
                submitting ||
                listing.source === 'system' ||
                listing.seller.id === user?.id ||
                (profile?.credits ?? 0) < listing.askingPrice
              }
              className="chrome-button-primary h-14 w-full rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-paper disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="mx-auto animate-spin" />
              ) : listing.source === 'system' ? (
                'System Preview'
              ) : listing.seller.id === user?.id ? (
                'Your Listing'
              ) : (profile?.credits ?? 0) < listing.askingPrice ? (
                '余额不足'
              ) : (
                `Acquire · ${listing.askingPrice} Cr.`
              )}
            </HapticTap>
          </div>
        </>
      )}
    </div>
  );
}
