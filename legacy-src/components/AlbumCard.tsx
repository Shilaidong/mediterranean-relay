import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Album } from '../data/albums';
import { useHaptic } from '../hooks/useHaptic';

export function AlbumCard({ album }: { album: Album }) {
  const navigate = useNavigate();
  const haptic = useHaptic();

  return (
    <motion.div
      layoutId={`card-${album.id}`}
      onClick={() => {
        haptic(15);
        navigate(`/detail/${album.id}`);
      }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col cursor-pointer"
    >
      <motion.div
        layoutId={`cover-${album.id}`}
        className="aspect-square bg-paper shadow-neumo p-1.5 rounded-sm"
      >
        <div className="w-full h-full bg-inkSoft overflow-hidden">
          <img
            src={album.cover}
            className="w-full h-full object-cover mix-blend-multiply opacity-80"
            alt={album.title}
          />
        </div>
      </motion.div>
      <h3 className="font-serif text-[18px] mt-4 leading-none">
        {album.title}
      </h3>
      <p className="text-[9px] font-bold tracking-tighter opacity-40 mt-2 uppercase">
        {album.artist}
      </p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm font-bold tracking-tight">
          {album.price} Cr.
        </span>
        {album.owned ? (
          <div className="w-2 h-2 rounded-full bg-ink shadow-md" />
        ) : (
          <div className="w-2 h-2 rounded-full border border-ink/30 bg-white shadow-inner" />
        )}
      </div>
    </motion.div>
  );
}
