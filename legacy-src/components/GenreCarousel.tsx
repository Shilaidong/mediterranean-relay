import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Disc3 } from 'lucide-react';
import { Genre } from '../data/albums';
import { useHaptic } from '../hooks/useHaptic';

type Props = {
  value: Genre | 'All';
  onChange: (v: Genre | 'All') => void;
};

const GENRES: (Genre | 'All')[] = ['All', 'Jazz', 'Rock', 'Folk', 'Soul', 'Classical'];
const ITEM_WIDTH = 72; // 固定按钮宽度

export function GenreCarousel({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0);
  const haptic = useHaptic();
  const activeIndex = GENRES.indexOf(value);

  // 居中目标位置
  const targetX = (() => {
    if (!containerRef.current) return 0;
    const containerWidth = containerRef.current.offsetWidth;
    return activeIndex * ITEM_WIDTH - containerWidth / 2 + ITEM_WIDTH / 2;
  })();

  // 切换选项时带弹簧动画滚动到目标位置
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.offsetWidth;
    const maxX = container.scrollWidth - containerWidth;
    const clampedX = Math.max(0, Math.min(targetX, maxX));

    const controls = animate(scrollX, clampedX, {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    });
    return () => controls.stop();
  }, [activeIndex, targetX, scrollX]);

  const handleSelect = (genre: Genre | 'All') => {
    if (genre === value) return;
    haptic(15);
    onChange(genre);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-serif italic opacity-60 shrink-0">
        Style
      </span>
      <div
        ref={containerRef}
        className="flex-1 ml-6 h-10 rounded-full bg-paper shadow-neumo-inset overflow-hidden"
      >
        <motion.div
          className="flex h-full items-center gap-1 px-2"
          style={{ x: scrollX }}
        >
          {GENRES.map((genre) => {
            const isActive = genre === value;
            return (
              <motion.button
                key={genre}
                onClick={() => handleSelect(genre)}
                whileTap={{ scale: isActive ? 1 : 0.95 }}
                className={`shrink-0 h-8 px-3 rounded-full flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-ink text-paper'
                    : 'bg-paper text-ink/60'
                }`}
              >
                <Disc3
                  size={12}
                  strokeWidth={1.5}
                  className={isActive ? 'opacity-90' : 'opacity-40'}
                />
                <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">
                  {genre}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
