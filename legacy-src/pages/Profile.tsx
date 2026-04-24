import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMyAlbums } from '../hooks/useAlbums';
import { HapticTap } from '../components/HapticTap';

export function Profile() {
  const { profile, user, signOut } = useAuth();
  const { data: myAlbums } = useMyAlbums();

  const ownedCount = myAlbums?.length || 0;
  const listedCount = myAlbums?.filter((a) => !a.owned).length || 0;

  const initials = profile?.username?.slice(0, 2).toUpperCase() || 'AR';
  const memberYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : '2019';

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <header className="text-center pt-12 pb-6">
        <h1 className="text-[32px] font-serif font-bold tracking-tight">
          收藏家档案
        </h1>
        <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-1 uppercase">
          Collector Profile
        </p>
      </header>

      <div className="px-6 pb-40 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-paper shadow-neumo rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-paper shadow-neumo-inset flex items-center justify-center font-serif text-[22px]">
            {initials}
          </div>
          <div>
            <p className="font-serif text-[20px] leading-none">
              {profile?.username || 'A. Relay'}
            </p>
            <p className="text-[10px] tracking-widest opacity-40 uppercase mt-1">
              Member since {memberYear}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Owned', value: ownedCount },
            { label: 'Listed', value: listedCount },
            { label: 'Credits', value: profile?.credits || 0 },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-paper shadow-neumo-inset rounded-2xl py-4 text-center"
            >
              <p className="font-serif text-[22px] leading-none">{s.value}</p>
              <p className="text-[9px] tracking-widest opacity-40 mt-2 uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-paper shadow-neumo rounded-2xl p-5">
          <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase">
            Settings
          </p>
          <ul className="mt-4 divide-y divide-ink/10">
            {['通知偏好', '支付与账单', '隐私与数据', '关于地中海中继站'].map(
              (t) => (
                <li
                  key={t}
                  className="py-3 flex justify-between items-center text-[14px]"
                >
                  <span>{t}</span>
                  <span className="opacity-30">›</span>
                </li>
              ),
            )}
          </ul>
        </div>

        <HapticTap
          onClick={signOut}
          className="w-full h-14 bg-paper shadow-neumo rounded-full flex items-center justify-center gap-2 font-bold tracking-[0.3em] text-[12px] uppercase text-stamp"
        >
          <LogOut size={16} />
          Sign Out
        </HapticTap>
      </div>
    </div>
  );
}
