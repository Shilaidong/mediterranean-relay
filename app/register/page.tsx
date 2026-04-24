'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, User } from 'lucide-react';
import { HapticTap } from '@/components/haptic-tap';
import { getBrowserSupabase } from '@/lib/supabase/browser';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/profile';
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = getBrowserSupabase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage('Account created. If email confirmation is enabled, check your inbox before signing in.');
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
          <h1 className="text-center text-[32px] font-serif font-bold text-ink">Join Relay</h1>
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
            Mediterranean Relay
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Username</label>
              <div className="relative mt-2">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="VinylHunter"
                  required
                  minLength={3}
                  className="field-shell h-12 w-full rounded-full pl-11 pr-4 text-[14px] placeholder:text-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/20"
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
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
            {message ? <p className="text-center text-[12px] text-ink/65">{message}</p> : null}

            <HapticTap
              type="submit"
              disabled={loading}
              className="chrome-button-primary mt-6 h-14 w-full rounded-full text-[12px] font-bold uppercase tracking-[0.3em] text-paper disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </HapticTap>
          </form>

          <p className="mt-8 text-center text-[12px] opacity-60">
            Already a member?{' '}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-bold text-ink">
              Sign In
            </Link>
          </p>

          <p className="mt-4 text-center text-[10px] opacity-40">
            By joining, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
