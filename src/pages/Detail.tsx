import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { findAlbum } from '../data/albums';
import { HapticTap } from '../components/HapticTap';

export function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const album = findAlbum(id || '');
  const rotateY = useMotionValue(0);
  const [playing, setPlaying] = useState(false);
  const [hoverNote, setHoverNote] = useState<number | null>(null);

  // 电平表两路 SVG 柱：随播放状态轻微随机抖动
  const [levels, setLevels] = useState<[number, number]>([0.2, 0.2]);
  useEffect(() => {
    if (!playing) {
      setLevels([0.1, 0.1]);
      return;
    }
    const iv = setInterval(() => {
      setLevels([0.4 + Math.random() * 0.6, 0.3 + Math.random() * 0.6]);
    }, 120);
    return () => clearInterval(iv);
  }, [playing]);

  const frontOpacity = useTransform(rotateY, [-90, 0, 90], [0, 1, 0]);
  const backOpacity = useTransform(rotateY, [90, 180, 270], [0, 1, 0]);

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif italic opacity-60">未找到此专辑</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      {/* 顶部返回 */}
      <div className="flex items-center justify-between px-6 pt-6">
        <HapticTap
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-paper shadow-neumo-inset flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
        <span className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
          Mechanical Stand
        </span>
        <div className="w-11 h-11" />
      </div>

      {/* 3D 封面 */}
      <div className="perspective-1000 px-10 mt-10">
        <motion.div
          className="relative aspect-square preserve-3d cursor-grab active:cursor-grabbing"
          style={{ rotateY }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDrag={(_, info) => {
            rotateY.set(rotateY.get() + info.delta.x * 0.8);
          }}
          onDragEnd={() => {
            const cur = rotateY.get();
            const snap = Math.round(cur / 180) * 180;
            animate(rotateY, snap, { type: 'spring', stiffness: 120, damping: 16 });
          }}
        >
          <motion.div
            style={{ opacity: frontOpacity }}
            className="absolute inset-0 backface-hidden bg-paper shadow-neumo p-2 rounded-sm"
          >
            <div className="w-full h-full bg-inkSoft overflow-hidden">
              <img
                src={album.cover}
                className="w-full h-full object-cover mix-blend-multiply opacity-80"
                alt={album.title}
              />
            </div>
          </motion.div>
          <motion.div
            style={{ opacity: backOpacity, rotateY: 180 }}
            className="absolute inset-0 backface-hidden bg-paper shadow-neumo p-4 rounded-sm"
          >
            <div className="w-full h-full border border-ink/20 rounded-sm p-4 flex flex-col">
              <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
                Tracklist · Side A/B
              </p>
              <div className="mt-4 space-y-2 flex-1 overflow-auto no-scrollbar">
                {album.tracks.map((t, i) => (
                  <div
                    key={t.name}
                    className="flex justify-between text-[13px] font-serif"
                  >
                    <span>
                      {String(i + 1).padStart(2, '0')}. {t.name}
                    </span>
                    <span className="opacity-50">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
        <p className="text-center text-[9px] font-bold opacity-30 mt-3 tracking-widest uppercase">
          左右拖拽 · 翻转查看背面
        </p>
      </div>

      {/* 标题与价格 */}
      <div className="px-8 mt-10">
        <h2 className="font-serif text-[32px] leading-none">{album.title}</h2>
        <p className="text-[10px] font-bold tracking-widest opacity-40 mt-3 uppercase">
          {album.artist} · {album.year}
        </p>
      </div>

      {/* 真空管电平表 + 播放 */}
      <div className="px-6 mt-10">
        <div className="bg-paper shadow-neumo-inset rounded-2xl px-5 py-4 flex items-center gap-4">
          <HapticTap
            onClick={() => setPlaying((p) => !p)}
            className="w-12 h-12 rounded-full bg-paper shadow-neumo flex items-center justify-center shrink-0"
          >
            {playing ? (
              <Pause size={18} className="text-ink" />
            ) : (
              <Play size={18} className="text-ink ml-0.5" />
            )}
          </HapticTap>
          <div className="flex-1 flex flex-col gap-2">
            {levels.map((lv, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-ink/10 overflow-hidden"
              >
                <motion.div
                  animate={{ width: `${lv * 100}%` }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-ink to-stamp"
                />
              </div>
            ))}
          </div>
          <span className="text-[9px] font-bold tracking-widest opacity-40">
            VU
          </span>
        </div>
      </div>

      {/* 磨损报告 */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
            Wear Report
          </p>
          <span className="text-[11px] font-bold tracking-wider">
            {album.wear.grade}
          </span>
        </div>
        <div className="relative aspect-square bg-paper shadow-neumo-inset rounded-2xl overflow-hidden">
          {/* 技术图纸风格：方格 */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
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
          {/* 唱片示意圆 */}
          <div className="absolute inset-8 rounded-full border border-ink/30" />
          <div className="absolute inset-[35%] rounded-full border border-ink/40" />
          {/* 瑕疵热区 */}
          {album.wear.notes.map((n, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoverNote(i)}
              onMouseLeave={() => setHoverNote(null)}
              onClick={() => setHoverNote(i === hoverNote ? null : i)}
              className="absolute w-4 h-4 rounded-full bg-stamp/80 -translate-x-1/2 -translate-y-1/2 shadow-md"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <span className="absolute inset-0 rounded-full bg-stamp/40 animate-ping" />
            </button>
          ))}
          {hoverNote !== null && (
            <div className="absolute bottom-4 left-4 right-4 bg-paper/90 backdrop-blur shadow-neumo-sm rounded-lg px-3 py-2 text-[12px] font-serif italic">
              {album.wear.notes[hoverNote].label}
            </div>
          )}
          {album.wear.notes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] tracking-widest opacity-40 uppercase">
                No Defects
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 立即购买 */}
      <div className="px-6 mt-8 pb-40">
        <HapticTap
          onClick={() => navigate(`/trade/${album.id}`)}
          className="w-full h-14 bg-ink text-paper rounded-full shadow-neumo font-bold tracking-[0.3em] text-[12px] uppercase"
        >
          Acquire · {album.price} Cr.
        </HapticTap>
      </div>
    </div>
  );
}
