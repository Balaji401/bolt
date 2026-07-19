'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile, type Subscription } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User) => {
    const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', u.id).maybeSingle();
    if (!existing) {
      const { data: created } = await supabase.from('profiles').insert({
        user_id: u.id,
        display_name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Trader',
        avatar_url: (u.user_metadata?.avatar_url as string) || null,
        plan_tier: 'free',
      }).select().maybeSingle();
      setProfile(created as Profile | null);
      // Create free subscription
      await supabase.from('subscriptions').insert({
        user_id: u.id,
        plan_tier: 'free',
        status: 'active',
      });
    } else {
      setProfile(existing as Profile);
    }
    const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', u.id).maybeSingle();
    setSubscription(sub as Subscription | null);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user || null);
      if (data.session?.user) {
        loadProfile(data.session.user).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user || null);
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await loadProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };
    return { error: friendlyAuthError(error) };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName || email.split('@')[0] } },
    });
    if (error) return { error: friendlyAuthError(error) };
    if (data.user) {
      // Create profile on signup so user lands on the app immediately.
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        display_name: displayName || email.split('@')[0],
        plan_tier: 'free',
      });
      await supabase.from('subscriptions').insert({
        user_id: data.user.id,
        plan_tier: 'free',
        status: 'active',
      });
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/` },
      });
      if (error) return { error: friendlyAuthError(error) };
      // OAuth redirect will occur; no error means redirect is in flight.
      return { error: null };
    } catch (e: any) {
      return { error: 'Google sign-in is not available right now. Please use email and password instead.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    setSession(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, subscription, loading, signIn, signUp, signInWithGoogle, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function friendlyAuthError(error: any): string {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || error?.error_code;
  if (code === 'weak_password' || msg.includes('weak_password') || msg.includes('password is known')) {
    return 'That password is too common. Please choose a stronger password (at least 8 characters, with a mix of letters, numbers, and symbols).';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check and try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('email not confirmed') || msg.includes('email_rate_limit')) {
    return 'Email confirmation is required. Contact support if you need help.';
  }
  if (msg.includes('provider is not enabled') || msg.includes('oauth') || msg.includes('google')) {
    return 'Google sign-in is not configured on this project yet. Please use email and password — it takes 10 seconds.';
  }
  if (msg.includes('rate limit') || msg.includes('rate_limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}
