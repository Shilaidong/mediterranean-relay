'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Shield, Store, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { HapticTap } from '@/components/haptic-tap';
import { BottomNav } from '@/components/bottom-nav';
import { useAuth } from '@/providers/auth-provider';
import type { ProfileResponse } from '@/lib/types';
import { PageTitle, SectionLabel } from '@/components/page-copy';

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      error: text,
    };
  }
}

export function ProfilePageClient() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [payload, setPayload] = useState<ProfileResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [actionId, setActionId] = useState('');
  const [listingDraft, setListingDraft] = useState<{
    inventoryId: string;
    askingPrice: string;
  } | null>(null);
  const [error, setError] = useState('');

  async function loadProfile() {
    setFetching(true);

    await fetch('/api/profile/me')
      .then(async (response) => {
        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error(String(data.error ?? 'Failed to load profile'));
        }
        return data;
      })
      .then((data) => {
        setPayload(data as unknown as ProfileResponse);
        setError('');
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setFetching(false);
      });
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.assign('/browse');
  }

  async function handleCancelListing(listingId: string) {
    setActionId(listingId);
    setError('');

    try {
      const response = await fetch(`/api/profile/listings/${listingId}/cancel`, {
        method: 'POST',
      });
      const result = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(String(result.error ?? '下架失败。'));
      }
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : '下架失败。');
    } finally {
      setActionId('');
    }
  }

  async function handleCreateListing(inventoryId: string) {
    const askingPrice = Number(listingDraft?.askingPrice);

    if (!askingPrice || askingPrice <= 0) {
      setError('请先填写有效的上架价格。');
      return;
    }

    setActionId(inventoryId);
    setError('');

    try {
      const response = await fetch(`/api/profile/inventory/${inventoryId}/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ askingPrice }),
      });
      const result = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(String(result.error ?? '上架失败。'));
      }
      setListingDraft(null);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上架失败。');
    } finally {
      setActionId('');
    }
  }

  const initials = payload?.profile.username?.slice(0, 2).toUpperCase() || 'AR';
  const memberYear = payload?.profile.created_at
    ? new Date(payload.profile.created_at).getFullYear()
    : '2019';

  return (
    <div className="h-full overflow-y-auto no-scrollbar pt-safe">
      <PageTitle english="Collector Profile" chinese="收藏家档案" className="pt-12" />

      <div className="space-y-6 px-6 pb-40">
        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-ink" />
          </div>
        ) : !payload ? (
          <div className="py-20 text-center font-serif italic opacity-60">{error || '档案加载失败'}</div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="paper-panel flex items-center gap-4 p-6"
            >
              <div className="paper-inset flex h-16 w-16 items-center justify-center rounded-full font-serif text-[22px]">
                {initials}
              </div>
              <div>
                <p className="font-serif text-[20px] leading-none">{payload.profile.username}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest opacity-40">
                  Member since {memberYear}
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Owned', value: payload.ownedItems.length },
                { label: 'Listed', value: payload.activeListings.length },
                { label: 'Credits', value: payload.profile.credits },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="paper-inset py-4 text-center"
                >
                  <p className="font-serif text-[22px] leading-none">{stat.value}</p>
                  <p className="mt-2 text-[9px] uppercase tracking-widest opacity-40">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="paper-panel p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                Settings · 账户设置
              </p>
              <ul className="mt-4 divide-y divide-ink/10">
                {[
                  'Notifications · 通知偏好',
                  'Billing · 支付与账单',
                  `Orders · 最近订单 (${payload.orders.length})`,
                  `Ledger · 积分流水 (${payload.ledger.length})`,
                ].map((item) => (
                  <li key={item} className="flex items-center justify-between py-3 text-[14px]">
                    <span>{item}</span>
                    <span className="opacity-30">›</span>
                  </li>
                ))}
              </ul>
              {payload.isAdmin ? (
                <Link
                  href="/admin"
                  className="chrome-button mt-4 flex h-12 items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em]"
                >
                  <Shield size={14} />
                  Admin Portal · 管理后台
                </Link>
              ) : null}
            </div>

            <section>
              <SectionLabel
                english="Active Listings"
                chinese="在售条目"
                count={payload.activeListings.length.toString().padStart(2, '0')}
              />
              {!payload.activeListings.length ? (
                <div className="paper-inset px-5 py-6 text-center font-serif italic opacity-40">
                  暂无在售条目
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {payload.activeListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="paper-panel w-40 shrink-0 rounded-2xl p-3"
                    >
                      <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-ink/5">
                        <img
                          src={listing.coverPhotoUrl ?? listing.release.coverUrl ?? ''}
                          alt={listing.release.title}
                          className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                        />
                      </div>
                      <p className="truncate font-serif text-[14px] font-bold">
                        {listing.release.title}
                      </p>
                      <p className="truncate text-[9px] uppercase tracking-[0.22em] opacity-45">
                        {listing.release.artist}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[12px] font-bold text-stamp">
                          {listing.askingPrice} Cr.
                        </span>
                        <span className="text-[9px] opacity-45">
                          {listing.inventory.conditionGrade}
                        </span>
                      </div>
                      <HapticTap
                        onClick={() => void handleCancelListing(listing.id)}
                        disabled={actionId === listing.id}
                        className="chrome-button mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-stamp disabled:opacity-50"
                      >
                        {actionId === listing.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <XCircle size={12} />
                        )}
                        Delist · 下架
                      </HapticTap>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionLabel
                english="Owned Archive"
                chinese="已拥有"
                count={payload.ownedItems.length.toString().padStart(2, '0')}
              />
              {!payload.ownedItems.length ? (
                <div className="paper-inset px-5 py-6 text-center font-serif italic opacity-40">
                  暂无已拥有藏品
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {payload.ownedItems.map((item) => (
                    <div
                      key={item.id}
                      className="paper-inset w-36 shrink-0 rounded-2xl p-3"
                    >
                      <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-ink/5">
                        <img
                          src={item.coverPhotoUrl ?? item.release.coverUrl ?? ''}
                          alt={item.release.title}
                          className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                        />
                      </div>
                      <p className="truncate font-serif text-[14px] font-bold">
                        {item.release.title}
                      </p>
                      <p className="truncate text-[9px] uppercase tracking-[0.22em] opacity-45">
                        {item.release.artist}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold">{item.conditionGrade}</span>
                        <span className="h-2 w-2 rounded-full bg-ink shadow-md" />
                      </div>
                      {item.activeListingId ? (
                        <div className="frost-tag mt-3 rounded-full px-3 py-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">
                          Listed · 已在售
                        </div>
                      ) : listingDraft?.inventoryId === item.id ? (
                        <div className="mt-3 space-y-2">
                          <input
                            value={listingDraft.askingPrice}
                            onChange={(event) =>
                              setListingDraft({
                                inventoryId: item.id,
                                askingPrice: event.target.value,
                              })
                            }
                            type="number"
                            min={1}
                            placeholder="Cr."
                            className="field-shell h-10 w-full rounded-full px-3 text-center text-[12px] outline-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <HapticTap
                              onClick={() => setListingDraft(null)}
                              className="chrome-button h-9 rounded-full text-[9px] font-bold uppercase tracking-[0.16em]"
                            >
                              取消
                            </HapticTap>
                            <HapticTap
                              onClick={() => void handleCreateListing(item.id)}
                              disabled={actionId === item.id}
                              className="chrome-button-primary flex h-9 items-center justify-center rounded-full text-[9px] font-bold uppercase tracking-[0.16em] text-paper disabled:opacity-50"
                            >
                              {actionId === item.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                '确认'
                              )}
                            </HapticTap>
                          </div>
                        </div>
                      ) : (
                        <HapticTap
                          onClick={() =>
                            setListingDraft({
                              inventoryId: item.id,
                              askingPrice: '45',
                            })
                          }
                          className="chrome-button mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
                        >
                          <Store size={12} />
                          List · 上架
                        </HapticTap>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="paper-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50">
                  Recent Orders · 最近订单
                </span>
                <span className="text-[10px] opacity-35">
                  {payload.orders.length.toString().padStart(2, '0')}
                </span>
              </div>
              {!payload.orders.length ? (
                <p className="py-4 text-center font-serif italic opacity-40">暂无交易记录</p>
              ) : (
                <div className="space-y-3">
                  {payload.orders.map((order) => (
                    <div
                      key={order.id}
                      className="paper-inset flex items-center justify-between rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[14px] font-bold">
                          {order.releaseTitle}
                        </p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] opacity-45">
                          {order.role === 'buyer' ? 'Acquired' : 'Sold'} ·{' '}
                          {new Date(order.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[12px] font-bold ${
                          order.role === 'buyer' ? 'text-ink' : 'text-stamp'
                        }`}
                      >
                        {order.role === 'buyer' ? '-' : '+'}
                        {order.totalPrice} Cr.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="paper-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50">
                  Credit Ledger · 积分流水
                </span>
                <span className="text-[10px] opacity-35">
                  {payload.ledger.length.toString().padStart(2, '0')}
                </span>
              </div>
              {!payload.ledger.length ? (
                <p className="py-4 text-center font-serif italic opacity-40">暂无积分流水</p>
              ) : (
                <div className="space-y-3">
                  {payload.ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="paper-inset flex items-center justify-between rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold">
                          {entry.note || entry.entryType}
                        </p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.22em] opacity-45">
                          Balance {entry.balanceAfter} ·{' '}
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[12px] font-bold ${
                          entry.delta >= 0 ? 'text-stamp' : 'text-ink'
                        }`}
                      >
                        {entry.delta >= 0 ? '+' : ''}
                        {entry.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <HapticTap
              onClick={handleSignOut}
              className="chrome-button flex h-14 w-full items-center justify-center gap-2 rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-stamp"
            >
              <LogOut size={16} />
              Sign Out · 退出登录
            </HapticTap>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
