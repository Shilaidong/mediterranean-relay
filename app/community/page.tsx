'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, MessageCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { HapticTap } from '@/components/haptic-tap';
import { BottomNav } from '@/components/bottom-nav';
import { PageTitle, SectionLabel } from '@/components/page-copy';
import { useAuth } from '@/providers/auth-provider';
import type { CommunityPost } from '@/lib/types';
import { systemCollectors, systemPosts, systemRecentSales } from '@/lib/system-showcase';

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [collectors, setCollectors] = useState<
    Array<{ id: string; name: string; avatar: string; followers: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function loadPosts() {
    setLoading(true);
    try {
      const postsResponse = await fetch('/api/community/posts');
      const postsPayload = await postsResponse.json();
      if (!postsResponse.ok) {
        throw new Error(postsPayload.error ?? 'Failed to load posts');
      }

      setPosts(postsPayload.posts ?? []);
      setCollectors(systemCollectors);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      setPosts(systemPosts);
      setCollectors(systemCollectors);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('A title is required to post.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create post');
      }
      setTitle('');
      setBody('');
      setPosts((current) => [payload.post as CommunityPost, ...current]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <PageTitle english="Community" chinese="中继站社区" />

      <div className="space-y-10 px-6 pb-40">
        {user ? (
          <section className="paper-panel p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50">
              Publish Thread · 发布讨论
            </p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Thread title · 帖子标题"
              className="field-shell mt-4 h-12 w-full rounded-full px-5 text-[14px] outline-none"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Share grading notes... · 分享你的收藏笔记"
              className="field-shell mt-3 w-full resize-none rounded-2xl px-5 py-4 text-[14px] outline-none"
            />
            <HapticTap
              onClick={handleSubmit}
              disabled={submitting}
              className="chrome-button-primary mt-4 h-12 w-full rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-paper disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish · 发布'}
            </HapticTap>
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-ink opacity-60" />
            <div className="flex-1">
              <SectionLabel
                english="Recent Sales"
                chinese="最近成交"
                className="mb-0"
                count={systemRecentSales.length ? String(systemRecentSales.length).padStart(2, '0') : undefined}
              />
            </div>
          </div>
          {systemRecentSales.length ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {systemRecentSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="paper-panel w-40 shrink-0 rounded-xl p-3"
              >
                <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-ink/5">
                  <img src={sale.cover} alt={sale.albumTitle} className="h-full w-full object-cover opacity-80 mix-blend-multiply" />
                </div>
                <div className="frost-tag mb-1 inline-flex rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.24em] text-stamp shadow-neumo-inset">
                  SYSTEM
                </div>
                <p className="truncate text-[11px] font-serif font-bold">{sale.albumTitle}</p>
                <p className="truncate text-[9px] opacity-50">{sale.artist}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-stamp">{sale.price} Cr.</span>
                  <span className="text-[9px] opacity-40">{sale.date}</span>
                </div>
              </motion.div>
              ))}
            </div>
          ) : (
            <div className="paper-inset rounded-2xl px-5 py-6 text-center font-serif italic opacity-40">
              暂无最近成交，导入后会显示在这里
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle size={14} className="text-ink opacity-60" />
            <div className="flex-1">
              <SectionLabel english="Hot Discussions" chinese="热门讨论" className="mb-0" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-ink" />
            </div>
          ) : !posts.length ? (
            <p className="py-8 text-center text-[12px] font-serif italic opacity-40">
              {error || '暂无讨论帖'}
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="paper-inset flex items-center gap-3 rounded-xl p-4">
                    {post.coverImageUrl ? (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                        <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover opacity-80 mix-blend-multiply" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {post.source === 'system' ? (
                        <div className="frost-tag mb-1 inline-flex rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.24em] text-stamp shadow-neumo-sm">
                          SYSTEM
                        </div>
                      ) : null}
                      <p className="line-clamp-2 text-[13px] font-serif font-bold leading-snug">
                        {post.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[9px] opacity-50">{post.author.username}</span>
                        <span className="text-[9px] opacity-30">·</span>
                        <span className="text-[9px] opacity-50">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[10px] opacity-50">
                      <MessageCircle size={12} />
                      <span>0</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
              Recommended Collectors · 推荐关注
            </span>
            <HapticTap className="flex items-center gap-1 text-[10px] text-ink opacity-60">
              查看全部 <ArrowRight size={10} />
            </HapticTap>
          </div>
          {collectors.length ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {collectors.map((collector, index) => (
              <motion.div
                key={collector.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06 }}
                className="flex shrink-0 flex-col items-center"
              >
                <div className="paper-panel h-16 w-16 rounded-full p-0.5">
                  <img src={collector.avatar} alt={collector.name} className="h-full w-full rounded-full object-cover" />
                </div>
                <p className="mt-2 text-[11px] font-bold">{collector.name}</p>
                <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-stamp">
                  SYSTEM
                </p>
                <p className="text-[9px] opacity-50">{collector.followers} followers</p>
              </motion.div>
              ))}
            </div>
          ) : (
            <div className="paper-inset rounded-2xl px-5 py-6 text-center font-serif italic opacity-40">
              暂无推荐账号，导入系统或收藏家账号后会显示在这里
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
