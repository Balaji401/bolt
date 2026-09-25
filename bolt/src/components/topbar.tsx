'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Plus, Crown, Sun, Moon, MessageSquare, Globe, ChevronDown, Check, Wallet } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTimezone, COMMON_TIMEZONES } from '@/components/timezone-provider';
import { useWorkspace } from '@/components/workspace-provider';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { cn } from '@/lib/utils';
import type { ModuleKey } from '@/lib/module-registry';

export function Topbar({ title, subtitle, active, onAdd, onShowPlans, onOpenChat, onOpenSearch, onNavigateAccounts }: { title: string; subtitle?: string; active: ModuleKey; onAdd?: () => void; onShowPlans?: () => void; onOpenChat?: () => void; onOpenSearch?: () => void; onNavigateAccounts?: () => void; }) {
  const { resolvedTheme, toggle } = useTheme();
  const { timezone, setTimezone, formatTime } = useTimezone();
  const { accounts, activeAccount, setActiveAccountId } = useWorkspace();
  const [now, setNow] = useState(new Date());
  const [tzOpen, setTzOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const [acctOpen, setAcctOpen] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);
  const acctRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filteredTzs = COMMON_TIMEZONES.filter((tz) => tz.label.toLowerCase().includes(tzSearch.toLowerCase()) || tz.value.toLowerCase().includes(tzSearch.toLowerCase()));
  const currentTz = COMMON_TIMEZONES.find((tz) => tz.value === timezone) || COMMON_TIMEZONES[0];
  const activeAccounts = accounts.filter((a) => a.status === 'active');

  return (
    <header className="sticky top-0 z-30 h-[68px] border-b border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6 xl:px-8">
        <div className="min-w-0 flex-1">
          <Breadcrumbs active={active} className="mb-0.5 hidden sm:flex" />
          <h1 className="truncate text-[1.05rem] font-semibold tracking-[-0.03em] text-foreground md:text-[1.35rem]">{title}</h1>
          {subtitle && <p className="hidden text-[11px] text-muted-foreground sm:block">{subtitle}</p>}
        </div>

        <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          NY Session Open
        </div>

        {/* Account switcher */}
        <div className="relative" ref={acctRef}>
          <button onClick={() => setAcctOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground max-w-[180px] sm:max-w-none" title="Switch trading account">
            <Wallet className="w-4 h-4 shrink-0" />
            <div className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
              <span className="max-w-[120px] truncate text-xs font-medium text-foreground">{activeAccount?.account_name || 'No account'}</span>
              <span className="text-[9px] text-muted-foreground">{activeAccount?.platform || 'Select...'}</span>
            </div>
            <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', acctOpen && 'rotate-180')} />
          </button>
          {acctOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-xl border border-border shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Switch Account</span>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin py-1">
                {activeAccounts.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center">No active accounts. Create one in the Accounts page.</div>
                ) : (
                  activeAccounts.map((acct) => (
                    <button key={acct.id} onClick={() => { setActiveAccountId(acct.id); setAcctOpen(false); }} className={cn('w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-secondary/60 transition-colors', activeAccount?.id === acct.id && 'text-primary')}>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{acct.account_name}</span>
                        <span className="text-[10px] text-muted-foreground">{acct.platform} · {acct.base_currency}</span>
                      </div>
                      {activeAccount?.id === acct.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              {onNavigateAccounts && (
                <div className="border-t border-border p-2">
                  <button onClick={() => { onNavigateAccounts(); setAcctOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Manage Accounts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onOpenSearch} className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-left transition-colors hover:border-primary/40 focus-within:border-primary/60 w-[240px] xl:w-[280px]">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">Search trades, instruments...</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">Ctrl K</kbd>
        </button>
        <button onClick={onOpenSearch} className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Search className="w-4 h-4" /></button>
        <div className="relative" ref={tzRef}>
          <button onClick={() => setTzOpen((v) => !v)} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Select timezone">
            <Globe className="w-4 h-4" />
            <div className="hidden sm:flex flex-col items-end leading-tight"><span className="text-xs font-medium tabular-nums text-foreground">{formatTime(now)}</span><span className="text-[9px] text-muted-foreground">{currentTz.label.split(' ')[0]}</span></div>
            <ChevronDown className={cn('w-3 h-3 transition-transform', tzOpen && 'rotate-180')} />
          </button>
          {tzOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-xl border border-border shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="p-3 border-b border-border"><div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border"><Search className="w-3.5 h-3.5 text-muted-foreground" /><input value={tzSearch} onChange={(e) => setTzSearch(e.target.value)} placeholder="Search timezone..." className="bg-transparent text-xs outline-none flex-1 placeholder:text-muted-foreground" autoFocus /></div></div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin py-1">
                {filteredTzs.map((tz) => (<button key={tz.value} onClick={() => { setTimezone(tz.value); setTzOpen(false); setTzSearch(''); }} className={cn('w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-secondary/60 transition-colors', timezone === tz.value && 'text-primary')}><div className="flex flex-col"><span className="font-medium">{tz.label}</span>{tz.offset && <span className="text-[10px] text-muted-foreground">UTC{tz.offset}</span>}</div>{timezone === tz.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}</button>))}
                {filteredTzs.length === 0 && <div className="px-3 py-4 text-xs text-muted-foreground text-center">No timezones found</div>}
              </div>
            </div>
          )}
        </div>
        <button onClick={toggle} title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">{resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
        {onOpenChat && <button onClick={onOpenChat} title="AI Trading Assistant" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"><MessageSquare className="w-4 h-4" /></button>}
        <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><Bell className="w-4 h-4" /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-warning animate-pulse-soft" /></button>
        {onShowPlans && <button onClick={onShowPlans} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-warning/15 to-primary/15 border border-warning/30 text-sm font-medium hover:border-warning/50 transition-colors"><Crown className="w-4 h-4 text-warning" /><span className="hidden lg:inline">Upgrade</span></button>}
        {onAdd && <button onClick={onAdd} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /><span className="hidden sm:inline">New Trade</span></button>}
      </div>
    </header>
  );
}
