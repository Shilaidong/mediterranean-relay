import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/browse', { replace: true }), 2400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-paper relative overflow-hidden">
      {/* 零件拼装动画 */}
      <div className="relative w-56 h-56">
        {/* 底座 */}
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-x-0 bottom-8 h-3 rounded-full bg-paper shadow-neumo mx-4"
        />
        {/* 唱片 */}
        <motion.div
          initial={{ scale: 0, rotate: -120 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-paper shadow-neumo flex items-center justify-center"
        >
          <div className="w-36 h-36 rounded-full bg-ink/90 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-paper shadow-neumo-inset" />
          </div>
        </motion.div>
        {/* 唱臂 */}
        <motion.div
          initial={{ rotate: -60, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.0, ease: 'easeOut' }}
          style={{ transformOrigin: '90% 10%' }}
          className="absolute top-2 right-2 w-28 h-2 rounded-full bg-silver shadow-neumo-sm"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="text-center mt-10"
      >
        <h1 className="text-[32px] font-serif font-bold tracking-tight text-ink">
          地中海中继站
        </h1>
        <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-1 uppercase text-ink">
          Mediterranean Relay
        </p>
      </motion.div>
    </div>
  );
}
