import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, TrendingUp } from 'lucide-react';
import { transactions, posts, collectors } from '../data/community';
import { HapticTap } from '../components/HapticTap';

export function Community() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <header className="text-center pt-10 pb-6">
        <h1 className="text-[32px] font-serif font-bold tracking-tight">
          Community
        </h1>
        <p className="text-[10px] tracking-[0.4em] font-bold opacity-40 mt-1 uppercase">
          中继站社区
        </p>
      </header>

      <div className="space-y-10 px-6 pb-40">
        {/* 最近成交 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-ink opacity-60" />
              <span className="text-[10px] tracking-[0.4em] font-bold opacity-60 uppercase">
                Recent Sales
              </span>
            </div>
            <span className="text-[10px] opacity-40">最近成交</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {transactions.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="shrink-0 w-40 bg-paper shadow-neumo rounded-xl p-3"
              >
                <div className="w-full aspect-square bg-ink/5 rounded-lg overflow-hidden mb-3">
                  <img
                    src={t.cover}
                    alt={t.albumTitle}
                    className="w-full h-full object-cover mix-blend-multiply opacity-80"
                  />
                </div>
                <p className="text-[11px] font-serif font-bold truncate">
                  {t.albumTitle}
                </p>
                <p className="text-[9px] opacity-50 truncate">{t.artist}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[12px] font-bold text-stamp">
                    {t.price} Cr.
                  </span>
                  <span className="text-[9px] opacity-40">{t.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 热门讨论 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-ink opacity-60" />
              <span className="text-[10px] tracking-[0.4em] font-bold opacity-60 uppercase">
                Hot Discussions
              </span>
            </div>
            <span className="text-[10px] opacity-40">热门讨论</span>
          </div>
          <div className="space-y-3">
            {posts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <HapticTap
                  onClick={() => {}}
                  className="flex items-center gap-3 bg-paper shadow-neumo-inset rounded-xl p-4"
                >
                  {p.cover && (
                    <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-ink/5">
                      <img
                        src={p.cover}
                        alt=""
                        className="w-full h-full object-cover mix-blend-multiply opacity-80"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-serif font-bold leading-snug line-clamp-2">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] opacity-50">{p.author}</span>
                      <span className="text-[9px] opacity-30">·</span>
                      <span className="text-[9px] opacity-50">{p.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] opacity-50 shrink-0">
                    <MessageCircle size={12} />
                    <span>{p.replies}</span>
                  </div>
                </HapticTap>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 推荐关注 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] tracking-[0.4em] font-bold opacity-60 uppercase">
              Recommended Collectors
            </span>
            <HapticTap onClick={() => {}} className="flex items-center gap-1 text-[10px] text-ink opacity-60">
              查看全部 <ArrowRight size={10} />
            </HapticTap>
          </div>
          <span className="text-[10px] opacity-40 block mb-4">推荐关注</span>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {collectors.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="shrink-0 flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-paper shadow-neumo p-0.5">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <p className="text-[11px] font-bold mt-2">{c.name}</p>
                <p className="text-[9px] opacity-50">{c.followers} followers</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
