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
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', u.id)
      .maybeSingle();

    if (!existing) {
      const displayName = (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Trader';
      const { data: created } = await supabase.from('profiles').insert({
        user_id: u.id,
        display_name: displayName,
        avatar_url: (u.user_metadata?.avatar_url as string) || null,
        plan_tier: 'free',
      }).select().maybeSingle();
      setProfile(created as Profile | null);

      await supabase.from('subscriptions').insert({
        user_id: u.id,
        plan_tier: 'free',
        status: 'active',
      });

      // Store email in email_signups (upsert so duplicates are safe)
      if (u.email) {
        await supabase.from('email_signups').upsert({
          email: u.email,
          display_name: displayName,
          user_id: u.id,
          source: 'signup_form',
          sheets_synced: false,
        }, { onConflict: 'email', ignoreDuplicates: false });
        // Trigger Google Sheets sync via edge function (fire-and-forget)
        triggerSheetsSync(u.email, displayName);
      }
    } else {
      setProfile(existing as Profile);
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', u.id)
      .maybeSingle();
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

    const { data: authSub } = supabase.auth.onAuthStateChange((event, newSession) => {
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

    return () => authSub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error) };
    // Ensure email is stored on every sign-in too.
    if (data.user?.email) {
      await supabase.from('email_signups').upsert({
        email: data.user.email,
        user_id: data.user.id,
        source: 'signin_form',
        sheets_synced: false,
      }, { onConflict: 'email', ignoreDuplicates: true });
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const name = displayName || email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: friendlyAuthError(error) };

    if (data.user) {
      // Profile + subscription are created in loadProfile (called by onAuthStateChange).
      // Also ensure email captured immediately even before SIGNED_IN fires.
      await supabase.from('email_signups').upsert({
        email: data.user.email || email,
        display_name: name,
        user_id: data.user.id,
        source: 'signup_form',
        sheets_synced: false,
      }, { onConflict: 'email', ignoreDuplicates: false });
      triggerSheetsSync(email, name);
    }
    return { error: null };
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
    <AuthContext.Provider value={{ session, user, profile, subscription, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Fire-and-forget — calls the edge function to push the new email to Google Sheets.
// Fails silently if the edge function is not deployed or credentials are not set.
function triggerSheetsSync(email: string, name: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-to-sheets`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({ email, name, timestamp: new Date().toISOString() }),
  }).catch(() => {
    // Silently ignore — edge function may not be deployed yet.
  });
}

function friendlyAuthError(error: any): string {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || error?.error_code;
  if (code === 'weak_password' || msg.includes('weak_password') || msg.includes('password is known')) {
    return 'That password is too common. Please choose a stronger password — at least 8 characters with a mix of letters, numbers, and symbols (e.g. Trading@2026).';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please double-check and try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account with this email already exists. Switch to "Sign in" and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please check your inbox and confirm your email address before signing in.';
  }
  if (msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('email_rate_limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error — check your connection and try again.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}
