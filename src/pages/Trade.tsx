import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { HapticTap } from '../components/HapticTap';
import { useHaptic } from '../hooks/useHaptic';
import { useAlbum, usePurchaseAlbum } from '../hooks/useAlbums';
import { useAuth } from '../contexts/AuthContext';

export function Trade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: album, isLoading } = useAlbum(id || '');
  const purchaseMutation = usePurchaseAlbum();
  const [stamped, setStamped] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number | null>(null);
  const haptic = useHaptic();

  const insufficientCredits = profile && album && profile.credits < album.price;

  const onPress = () => {
    if (insufficientCredits || stamped || purchaseMutation.isPending) return;
    setPressing(true);
    timer.current = window.setTimeout(async () => {
      haptic(30);
      setPressing(false);

      if (!album) return;

      try {
        await purchaseMutation.mutateAsync({
          albumId: album.id,
          price: album.price,
        });
        setStamped(true);
      } catch (err: any) {
        setError(err.message || '交易失败，请重试');
      }
    }, 300);
  };

  const onRelease = () => {
    setPressing(false);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-ink animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif italic opacity-60">未找到交易对象</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <div className="flex items-center justify-between px-6 pt-6">
        <HapticTap
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-paper shadow-neumo-inset flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
        <span className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
          Trade Center
        </span>
        <div className="w-11 h-11" />
      </div>

      <div className="px-8 mt-8 pb-40">
        {/* 合同纸 */}
        <div className="relative bg-paper shadow-neumo rounded-sm px-7 py-8 overflow-hidden">
          {/* 纸纹 */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle_at_30%_20%,#1A4B9E_0%,transparent_40%)]" />
          <p className="text-[9px] tracking-[0.4em] font-bold opacity-40 uppercase">
            Mediterranean Relay
          </p>
          <h2 className="font-serif italic text-[38px] leading-none mt-2">
            Bill of Sale
          </h2>
          <div className="mt-6 h-px bg-ink/20" />

          <dl className="mt-6 space-y-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="opacity-50">Item</dt>
              <dd className="font-serif">{album.title}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="opacity-50">Artist</dt>
              <dd>{album.artist}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="opacity-50">Grade</dt>
              <dd>{album.wear.grade}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="opacity-50">Year</dt>
              <dd>{album.year}</dd>
            </div>
            <div className="flex justify-between text-[16px] pt-3 border-t border-ink/20">
              <dt className="font-bold">Total</dt>
              <dd className="font-serif font-bold">{album.price} Cr.</dd>
            </div>
            {profile && (
              <div className="flex justify-between text-[12px]">
                <dt className="opacity-50">Your Balance</dt>
                <dd className={insufficientCredits ? 'text-stamp' : 'text-ink'}>
                  {profile.credits} Cr.
                </dd>
              </div>
            )}
          </dl>

          {/* 盖章区 */}
          <div className="mt-10 relative h-40 flex items-end justify-end">
            <div className="absolute left-0 bottom-6">
              <p className="text-[9px] tracking-[0.3em] opacity-40 uppercase">
                Seller Signature
              </p>
              <p className="font-serif italic text-[22px] mt-1 opacity-70">
                A. Relay
              </p>
            </div>

            <div className="relative w-28 h-28">
              <AnimatePresence>
                {stamped && (
                  <motion.div
                    key="stamp"
                    initial={{ scale: 2.2, rotate: 10, opacity: 0 }}
                    animate={{
                      scale: 1,
                      rotate: -8,
                      opacity: 0.9,
                      transition: {
                        type: 'spring',
                        stiffness: 260,
                        damping: 14,
                      },
                    }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-full border-[3px] border-stamp flex items-center justify-center"
                    style={{ color: '#B23A3A' }}
                  >
                    <div className="text-center leading-tight">
                      <p className="text-[9px] tracking-[0.3em] font-bold">
                        SETTLED
                      </p>
                      <p className="font-serif text-[14px]">
                        {new Date().toISOString().slice(0, 10)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-stamp text-center mt-4"
          >
            {error}
          </motion.p>
        )}

        {/* 按钮 / 成交提示 */}
        {!stamped ? (
          <HapticTap
            onMouseDown={onPress}
            onMouseUp={onRelease}
            onMouseLeave={onRelease}
            onTouchStart={onPress}
            onTouchEnd={onRelease}
            disabled={!!insufficientCredits || purchaseMutation.isPending}
            className={`w-full h-16 mt-10 rounded-full font-bold tracking-[0.3em] text-[12px] uppercase transition-shadow ${
              pressing
                ? 'shadow-neumo-inset'
                : insufficientCredits
                  ? 'shadow-neumo-inset opacity-50'
                  : 'shadow-neumo'
            }`}
          >
            {purchaseMutation.isPending
              ? '处理中...'
              : pressing
                ? '按住盖章…'
                : insufficientCredits
                  ? '余额不足'
                  : '长按盖章 · 完成交易'}
          </HapticTap>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <CheckCircle2 size={36} className="mx-auto text-ink" />
            <p className="font-serif italic text-[20px] mt-3">交易已归档</p>
            <HapticTap
              onClick={() => navigate('/home')}
              className="mt-6 w-full h-14 bg-ink text-paper rounded-full shadow-neumo font-bold tracking-[0.3em] text-[12px] uppercase"
            >
              前往收藏箱
            </HapticTap>
          </motion.div>
        )}
      </div>
    </div>
  );
}
