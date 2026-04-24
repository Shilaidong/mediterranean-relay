'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { HapticTap } from '@/components/haptic-tap';
import { getBrowserSupabase } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/profile';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = getBrowserSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex items-center px-6 pt-6">
        <HapticTap
          onClick={() => router.push('/browse')}
          className="paper-inset flex h-11 w-11 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} className="text-ink" />
        </HapticTap>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <h1 className="text-center text-[32px] font-serif font-bold text-ink">Welcome Back</h1>
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
            Mediterranean Relay
          </p>

          <form onSubmit={handleSubmit} className="mt-12 space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Email</label>
              <div className="relative mt-2">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="collector@relay.com"
                  required
                  className="field-shell h-12 w-full rounded-full pl-11 pr-4 text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Password</label>
              <div className="relative mt-2">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="field-shell h-12 w-full rounded-full pl-11 pr-4 text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/20"
                />
              </div>
            </div>

            {error ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] text-stamp">
                {error}
              </motion.p>
            ) : null}

            <HapticTap
              type="submit"
              disabled={loading}
              className="chrome-button-primary mt-6 h-14 w-full rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-paper disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </HapticTap>
          </form>

          <p className="mt-8 text-center text-[12px] opacity-60">
            New to Relay?{' '}
            <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-bold text-ink">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
