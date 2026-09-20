'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile, type Subscription } from '@/lib/supabase';

type ProfileUpdate = Partial<Pick<Profile,
  'display_name' | 'full_name' | 'username' | 'avatar_url' |
  'timezone' | 'preferred_currency' | 'preferred_language' | 'trading_experience'
>>;

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
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
    try {
      const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', u.id).maybeSingle();
      if (!existing) {
        const displayName = (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Trader';
        const { data: created } = await supabase.from('profiles').insert({
          user_id: u.id, display_name: displayName, avatar_url: (u.user_metadata?.avatar_url as string) || null, plan_tier: 'free',
        }).select().maybeSingle();
        setProfile(created as Profile | null);
        await supabase.from('subscriptions').insert({ user_id: u.id, plan_tier: 'free', status: 'active' });
        if (u.email) {
          await supabase.from('email_signups').upsert({ email: u.email, display_name: displayName, user_id: u.id, source: 'signup_form', sheets_synced: false }, { onConflict: 'email', ignoreDuplicates: false });
          triggerSheetsSync(u.email, displayName);
        }
      } else {
        setProfile(existing as Profile);
      }
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', u.id).maybeSingle();
      setSubscription(sub as Subscription | null);
    } catch (err) {
      console.error('loadProfile error:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user || null);
      if (data.session?.user) {
        loadProfile(data.session.user).then(() => {
          if (mounted) {
            supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('user_id', data.session!.user.id).then();
          }
        }).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Keep this callback synchronous. Supabase can deadlock if another
      // Supabase API call is awaited from inside onAuthStateChange.
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          // Defer profile/workspace hydration until after the auth event finishes.
          setTimeout(() => {
            void loadProfile(newSession.user).catch((err) => {
              console.error('Deferred profile load error:', err);
            });
          }, 0);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSubscription(null);
      }

      setLoading(false);
    });

    return () => authSub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error) };
    if (data.user?.email) {
      await supabase.from('email_signups').upsert({ email: data.user.email, user_id: data.user.id, source: 'signin_form', sheets_synced: false }, { onConflict: 'email', ignoreDuplicates: true });
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: friendlyAuthError(error) };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const name = displayName || email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return { error: friendlyAuthError(error) };
    if (data.user) {
      await supabase.from('email_signups').upsert({ email: data.user.email || email, display_name: name, user_id: data.user.id, source: 'signup_form', sheets_synced: false }, { onConflict: 'email', ignoreDuplicates: false });
      triggerSheetsSync(email, name);
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null); setSubscription(null); setSession(null); setUser(null);
  }, []);

  const signOutAllDevices = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) return { error: friendlyAuthError(error) };
    setProfile(null); setSubscription(null); setSession(null); setUser(null);
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: friendlyAuthError(error) };
    return { error: null };
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: friendlyAuthError(error) };
    return { error: null };
  }, []);

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .maybeSingle();
    if (error) return { error: 'Failed to update profile. Please try again.' };
    if (data) setProfile(data as Profile);
    return { error: null };
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) return { error: 'Failed to process account deletion. Please try again.' };
    await supabase.auth.signOut();
    setProfile(null); setSubscription(null); setSession(null); setUser(null);
    return { error: null };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{
      session, user, profile, subscription, loading,
      signIn, signInWithGoogle, signUp, signOut, signOutAllDevices, resetPassword, changePassword, updateProfile, deleteAccount, refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function triggerSheetsSync(email: string, name: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-to-sheets`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
    body: JSON.stringify({ email, name, timestamp: new Date().toISOString() }),
  }).catch(() => {});
}

function friendlyAuthError(error: any): string {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || error?.error_code;
  if (code === 'weak_password' || msg.includes('weak_password')) return 'That password is too common. Please choose a stronger password — at least 8 characters with a mix of letters, numbers, and symbols.';
  if (msg.includes('invalid login credentials')) return 'Incorrect email or password. Please double-check and try again.';
  if (msg.includes('user already registered')) return 'An account with this email already exists. Switch to "Sign in" and try again.';
  if (msg.includes('email not confirmed')) return 'Please check your inbox and confirm your email address before signing in.';
  if (msg.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error — check your connection and try again.';
  return error?.message || 'Something went wrong. Please try again.';
}
