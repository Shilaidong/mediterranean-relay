import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { albums } from '../data/albums';
import { AlbumCard } from '../components/AlbumCard';
import { useHaptic } from '../hooks/useHaptic';

export function Home() {
  const pull = useMotionValue(0);
  const springLabelOpacity = useTransform(pull, [0, 60], [0, 1]);
  const [refreshing, setRefreshing] = useState(false);
  const haptic = useHaptic();

  // Only show owned albums
  const ownedAlbums = albums.filter((a) => !!a.owned);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe relative">
      {/* 下拉刷新指示 */}
      <motion.div
        style={{ height: pull, opacity: springLabelOpacity }}
        className="flex items-center justify-center text-[10px] tracking-widest font-bold opacity-60 uppercase"
      >
        {refreshing ? 'Rewinding…' : 'Pull to Refresh'}
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={(_, info) => {
          if (info.offset.y > 0) pull.set(Math.min(info.offset.y * 0.5, 80));
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80) {
            haptic(15);
            setRefreshing(true);
            setTimeout(() => {
              setRefreshing(false);
              pull.set(0);
            }, 900);
          } else {
            pull.set(0);
          }
        }}
      >
        <header className="text-center pt-10 pb-4">
          <h1 className="text-[32px] font-serif font-bold tracking-tight">
            My Collection
          </h1>
          <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-1 uppercase">
            个人收藏
          </p>
        </header>

        <div className="space-y-8 px-6 pb-40">
          {ownedAlbums.length === 0 ? (
            <div className="text-center py-20 opacity-40 font-serif italic">
              暂无收藏，快去逛逛市场吧
            </div>
          ) : (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] tracking-[0.4em] font-bold opacity-60 uppercase">
                  Owned · 已拥有
                </span>
                <div className="flex-1 h-px bg-ink/20" />
                <span className="text-[10px] opacity-40">
                  {ownedAlbums.length.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="bg-paper shadow-neumo-inset rounded-2xl p-4">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {ownedAlbums.map((a) => (
                    <div key={a.id} className="w-36 shrink-0">
                      <AlbumCard album={a} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  );
}
