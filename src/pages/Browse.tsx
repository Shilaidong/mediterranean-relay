import { useMemo, useState } from 'react';
import { albums, Genre } from '../data/albums';
import { AlbumCard } from '../components/AlbumCard';
import { RelaySlider } from '../components/RelaySlider';
import { GenreCarousel } from '../components/GenreCarousel';
import { FloatingAction } from '../components/FloatingAction';

export function Browse() {
  const [rarity, setRarity] = useState(50);
  const [genre, setGenre] = useState<Genre | 'All'>('All');

  const visible = useMemo(() => {
    // 仅显示在售专辑（未拥有），且匹配稀缺度和风格
    return albums.filter((a) => {
      if (a.owned) return false;
      if (Math.abs(a.rarity - rarity) > 40) return false;
      if (genre !== 'All' && a.genre !== genre) return false;
      return true;
    });
  }, [rarity, genre]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <header className="text-center pt-12 pb-8">
        <h1 className="text-[38px] font-serif font-bold tracking-tight">
          地中海中继站
        </h1>
        <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-1 uppercase">
          Mediterranean Relay
        </p>
      </header>

      <div className="px-6 mb-4">
        <RelaySlider
          min={12}
          max={85}
          value={rarity}
          onChange={setRarity}
          label="Archive Collection"
        />
      </div>

      <div className="px-6 mb-10">
        <GenreCarousel value={genre} onChange={setGenre} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-6 pb-40">
        {visible.map((a) => (
          <AlbumCard key={a.id} album={a} />
        ))}
        {visible.length === 0 && (
          <div className="col-span-2 text-center py-20 opacity-40 font-serif italic">
            暂无匹配此筛选条件的专辑
          </div>
        )}
      </div>

      <FloatingAction />
    </div>
  );
}
