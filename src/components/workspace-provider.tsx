'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type Workspace, type TradingAccount } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

type WorkspaceState = {
  workspace: Workspace | null;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  loading: boolean;
  error: string | null;
  setActiveAccountId: (id: string) => void;
  refreshAccounts: () => Promise<void>;
  createAccount: (data: Partial<TradingAccount>) => Promise<{ error: string | null; data?: TradingAccount }>;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => Promise<{ error: string | null }>;
  archiveAccount: (id: string) => Promise<{ error: string | null }>;
  restoreAccount: (id: string) => Promise<{ error: string | null }>;
  setDefaultAccount: (id: string) => Promise<{ error: string | null }>;
  updateWorkspace: (updates: Partial<Workspace>) => Promise<{ error: string | null }>;
};

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

const ACTIVE_ACCOUNT_KEY = 'traderos-active-account';

const getActiveAccountKey = (userId: string) => `${ACTIVE_ACCOUNT_KEY}:${userId}`;

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (userId: string) => {
    const { data: existing } = await supabase.from('workspaces').select('*').eq('user_id', userId).maybeSingle();
    if (existing) {
      setWorkspace(existing as Workspace);
      return existing as Workspace;
    }
    const { data: created, error: createErr } = await supabase.from('workspaces').insert({
      user_id: userId, name: 'Personal', workspace_type: 'personal', is_default: true,
    }).select().maybeSingle();
    if (createErr) { setError('Failed to create workspace.'); return null; }
    setWorkspace(created as Workspace);
    return created as Workspace;
  }, []);

  const loadAccounts = useCallback(async (wsId: string) => {
    const { data, error: loadErr } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: true });
    if (loadErr) { setError('Failed to load trading accounts.'); return []; }
    return (data || []) as TradingAccount[];
  }, []);

  useEffect(() => {
    if (!user) { setWorkspace(null); setAccounts([]); setActiveAccountIdState(null); setLoading(false); return; }
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const ws = await loadWorkspace(user.id);
      if (!ws || !mounted) { if (mounted) setLoading(false); return; }
      const accts = await loadAccounts(ws.id);
      if (!mounted) return;
      setAccounts(accts);

      const accountStorageKey = getActiveAccountKey(user.id);
      const savedId = localStorage.getItem(accountStorageKey);
      const defaultAcct = accts.find((a) => a.is_default && a.status === 'active');
      const savedAcct = accts.find((a) => a.id === savedId && a.status === 'active');
      const firstActive = accts.find((a) => a.status === 'active');
      const chosen = savedAcct || defaultAcct || firstActive || null;
      if (chosen) {
        setActiveAccountIdState(chosen.id);
        localStorage.setItem(accountStorageKey, chosen.id);
      } else {
        setActiveAccountIdState(null);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, loadWorkspace, loadAccounts]);

  const setActiveAccountId = useCallback((id: string) => {
    setActiveAccountIdState(id);
    if (user) localStorage.setItem(getActiveAccountKey(user.id), id);
  }, []);

  const refreshAccounts = useCallback(async () => {
    if (!workspace) return;
    const accts = await loadAccounts(workspace.id);
    setAccounts(accts);
    const stillActive = accts.find((a) => a.id === activeAccountId && a.status === 'active');
    if (!stillActive) {
      const fallback = accts.find((a) => a.status === 'active') || null;
      if (fallback) setActiveAccountId(fallback.id);
      else setActiveAccountIdState(null);
    }
  }, [workspace, loadAccounts, activeAccountId]);

  const createAccount = useCallback(async (data: Partial<TradingAccount>) => {
    if (!workspace) return { error: 'No workspace loaded.' };
    if (!data.account_name || !data.platform || !data.account_type) return { error: 'Account name, platform, and type are required.' };
    const insert = {
      workspace_id: workspace.id,
      account_name: data.account_name,
      broker_name: data.broker_name || null,
      platform: data.platform,
      account_number: data.account_number || null,
      account_type: data.account_type,
      base_currency: data.base_currency || workspace.default_currency,
      timezone: data.timezone || workspace.default_timezone,
      initial_balance: data.initial_balance ?? 0,
      current_balance: data.current_balance ?? data.initial_balance ?? 0,
      status: 'active' as const,
      notes: data.notes || null,
    };
    const { data: created, error: insertErr } = await supabase.from('trading_accounts').insert(insert).select().maybeSingle();
    if (insertErr) {
      if (insertErr.code === '23505') return { error: 'An account with this name already exists in your workspace.' };
      return { error: 'Failed to create trading account. Please try again.' };
    }
    const newAccount = created as TradingAccount;
    setAccounts((prev) => [...prev, newAccount]);
    if (!activeAccountId || accounts.length === 0) setActiveAccountId(newAccount.id);
    return { error: null, data: newAccount };
  }, [workspace, activeAccountId, accounts.length, setActiveAccountId]);

  const updateAccount = useCallback(async (id: string, updates: Partial<TradingAccount>) => {
    const { error: updateErr } = await supabase
      .from('trading_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateErr) return { error: 'Failed to update account. Please try again.' };
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
    return { error: null };
  }, []);

  const archiveAccount = useCallback(async (id: string) => {
    const result = await updateAccount(id, { status: 'archived' });
    if (result.error) return result;
    if (activeAccountId === id) {
      const fallback = accounts.find((a) => a.id !== id && a.status === 'active');
      if (fallback) setActiveAccountId(fallback.id);
      else setActiveAccountIdState(null);
    }
    return { error: null };
  }, [updateAccount, activeAccountId, accounts, setActiveAccountId]);

  const restoreAccount = useCallback(async (id: string) => {
    return updateAccount(id, { status: 'active' });
  }, [updateAccount]);

  const setDefaultAccount = useCallback(async (id: string) => {
    if (!workspace) return { error: 'No workspace loaded.' };
    await supabase.from('trading_accounts').update({ is_default: false }).eq('workspace_id', workspace.id);
    const result = await updateAccount(id, { is_default: true });
    if (result.error) return result;
    setAccounts((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    return { error: null };
  }, [workspace, updateAccount]);

  const updateWorkspace = useCallback(async (updates: Partial<Workspace>) => {
    if (!workspace) return { error: 'No workspace loaded.' };
    const { data, error: updateErr } = await supabase
      .from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', workspace.id)
      .select()
      .maybeSingle();
    if (updateErr) return { error: 'Failed to update workspace settings.' };
    if (data) setWorkspace(data as Workspace);
    return { error: null };
  }, [workspace]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;

  return (
    <WorkspaceContext.Provider value={{
      workspace, accounts, activeAccount, loading, error,
      setActiveAccountId, refreshAccounts, createAccount, updateAccount,
      archiveAccount, restoreAccount, setDefaultAccount, updateWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
