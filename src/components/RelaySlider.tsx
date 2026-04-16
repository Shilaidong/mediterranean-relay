import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type Props = {
  min?: number;
  max?: number;
  value: number;
  onChange: (v: number) => void;
  label?: string;
};

export function RelaySlider({
  min = 0,
  max = 100,
  value,
  onChange,
  label = 'Archive Collection',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (trackWidth > 0) {
      x.set(((value - min) / (max - min)) * trackWidth);
    }
  }, [value, min, max, trackWidth, x]);

  const progress = useTransform(x, (v) => `${(v / (trackWidth || 1)) * 100}%`);

  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-serif italic opacity-60 shrink-0">
        {label}
      </span>
      <div className="flex-1 ml-6 h-8 rounded-full flex items-center px-4 shadow-neumo-inset bg-paper">
        <span className="text-[10px] opacity-40">{min}</span>
        <div
          ref={trackRef}
          className="flex-1 h-[1.5px] bg-ink/20 mx-4 relative"
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-ink"
            style={{ width: progress }}
          />
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: trackWidth }}
            dragElastic={0.1}
            dragMomentum={false}
            style={{ x }}
            onDrag={() => {
              const ratio = x.get() / (trackWidth || 1);
              onChange(Math.round(min + ratio * (max - min)));
            }}
            dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
            className="absolute -top-[7px] -translate-x-1/2 w-4 h-4 rounded-full bg-paper border-[1.5px] border-ink shadow-sm cursor-grab active:cursor-grabbing"
          />
        </div>
        <span className="text-[10px] opacity-40">{max}</span>
      </div>
    </div>
  );
}
