'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserSupabase, resetBrowserSupabase } from '@/lib/supabase/browser';
import type { AppProfile } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, credits, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as AppProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getBrowserSupabase();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setProfile(await loadProfile(data.session.user.id));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        setProfile(await loadProfile(nextSession.user.id));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      refreshProfile: async () => {
        if (!user) {
          setProfile(null);
          return;
        }
        setProfile(await loadProfile(user.id));
      },
      signOut: async () => {
        const supabase = getBrowserSupabase();
        await fetch('/api/auth/sign-out', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        }).catch(() => null);
        await supabase.auth.signOut({ scope: 'local' });
        resetBrowserSupabase();
        setSession(null);
        setUser(null);
        setProfile(null);
      },
    }),
    [loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
