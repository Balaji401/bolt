'use client';
import { useState, useEffect, useCallback } from 'react';
import { Crown, LogOut, User, ChevronRight, ChevronDown, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, PlanTier } from '@/lib/supabase';
import { MODULES, MODULE_GROUPS, type ModuleKey, type ModuleMeta } from '@/lib/module-registry';
import { BrandLogo } from '@/components/brand/brand-logo';

export type { ModuleKey };

const TIER_COLORS: Record<PlanTier, string> = { free: 'text-muted-foreground', starter: 'text-chart-3', pro: 'text-primary', elite: 'text-warning' };
const FAV_KEY = 'traderos-favorites';
const RECENT_KEY = 'traderos-recent-modules';
const COLLAPSED_KEY = 'traderos-collapsed-groups';

function loadArr(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }

export function Sidebar({ active, onSelect, onShowPlans, onSignOut, profile, tier }: { active: ModuleKey; onSelect: (k: ModuleKey) => void; onShowPlans: () => void; onSignOut: () => void; profile: Profile | null; tier: PlanTier; }) {
  const [favorites, setFavorites] = useState<ModuleKey[]>([]);
  const [recent, setRecent] = useState<ModuleKey[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => { setFavorites(loadArr(FAV_KEY) as ModuleKey[]); setRecent(loadArr(RECENT_KEY) as ModuleKey[]); setCollapsed(loadArr(COLLAPSED_KEY)); }, []);

  useEffect(() => {
    if (!active) return;
    setRecent((prev) => { const next = [active, ...prev.filter((k) => k !== active)].slice(0, 4); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); return next; });
  }, [active]);

  const toggleFavorite = useCallback((key: ModuleKey) => {
    setFavorites((prev) => { const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]; localStorage.setItem(FAV_KEY, JSON.stringify(next)); return next; });
  }, []);

  const toggleCollapse = useCallback((group: string) => {
    setCollapsed((prev) => { const next = prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]; localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)); return next; });
  }, []);

  const isFav = (key: ModuleKey) => favorites.includes(key);
  const initials = (profile?.display_name || 'T').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const visibleModules = MODULES.filter((m) => {
    if (m.visibility === 'admin') return false;
    if (m.visibility === 'elite') return tier === 'elite';
    if (m.visibility === 'pro') return ['pro', 'elite'].includes(tier);
    return true;
  });

  const favModules = favorites.map((k) => MODULES.find((m) => m.key === k)).filter(Boolean) as ModuleMeta[];
  const recentModules = recent.map((k) => MODULES.find((m) => m.key === k)).filter((m) => m && m.key !== active) as ModuleMeta[];

  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-[0_0_0_1px_rgba(56,189,248,0.08)]">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-white/10 bg-slate-950/80 px-4"><BrandLogo /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {favModules.length > 0 && (<div className="mb-3"><div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Star className="w-3 h-3 text-warning" /> Favorites</div><div className="space-y-0.5">{favModules.map((n) => (<NavButton key={n.key} meta={n} active={active === n.key} onSelect={onSelect} isFav={true} onToggleFav={toggleFavorite} />))}</div></div>)}
        {recentModules.length > 0 && (<div className="mb-3"><div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Recent</div><div className="space-y-0.5">{recentModules.map((n) => (<NavButton key={n.key} meta={n} active={active === n.key} onSelect={onSelect} isFav={isFav(n.key)} onToggleFav={toggleFavorite} />))}</div></div>)}
        {MODULE_GROUPS.map((g) => {
          const groupModules = visibleModules.filter((m) => m.group === g);
          if (groupModules.length === 0) return null;
          const isCollapsed = collapsed.includes(g);
          return (<div key={g}><button onClick={() => toggleCollapse(g)} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">{g}{isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>{!isCollapsed && (<div className="space-y-0.5 mt-0.5">{groupModules.map((n) => (<NavButton key={n.key} meta={n} active={active === n.key} onSelect={onSelect} isFav={isFav(n.key)} onToggleFav={toggleFavorite} />))}</div>)}</div>);
        })}
      </nav>
      <div className="border-t border-white/10 p-3 space-y-2">
        <button onClick={onShowPlans} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/15 via-sky-400/10 to-emerald-500/15 border border-cyan-400/30 text-xs font-medium hover:border-cyan-400/50 transition-colors"><Crown className="w-3.5 h-3.5 text-warning" /><span className="flex-1 text-left">Upgrade plan</span><span className={cn('text-[10px] uppercase tracking-widest font-semibold', TIER_COLORS[tier])}>{tierLabel}</span><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 flex items-center gap-3">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 text-sm font-semibold shrink-0">{initials}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" />{profile?.display_name || 'Trader'}</div><div className={cn('text-xs flex items-center gap-1', TIER_COLORS[tier])}><Crown className="w-3 h-3" /> {tierLabel} plan</div></div>
          <button onClick={onSignOut} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-destructive transition-colors" title="Sign out"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </aside>
  );
}

function NavButton({ meta, active, onSelect, isFav, onToggleFav }: { meta: ModuleMeta; active: boolean; onSelect: (k: ModuleKey) => void; isFav: boolean; onToggleFav: (k: ModuleKey) => void }) {
  const Icon = meta.icon;
  return (
    <div className="group relative">
      <button onClick={() => onSelect(meta.key)} className={cn('group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 pr-8', active ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/20' : 'text-slate-300 hover:text-white hover:bg-white/5')}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-cyan-400" />}
        <Icon className="w-4 h-4 shrink-0" />
        <span className="font-medium flex-1 text-left">{meta.label}</span>
        {meta.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wide">{meta.badge}</span>}
        {meta.comingSoon && !meta.badge && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">Soon</span>}
      </button>
      <button onClick={(e) => { e.stopPropagation(); onToggleFav(meta.key); }} className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all', isFav ? 'opacity-100 text-warning' : 'opacity-0 group-hover:opacity-60 text-muted-foreground hover:opacity-100')} title={isFav ? 'Remove from favorites' : 'Add to favorites'}><Star className={cn('w-3 h-3', isFav && 'fill-warning')} /></button>
    </div>
  );
}

export function MobileNav({ active, onSelect }: { active: ModuleKey; onSelect: (k: ModuleKey) => void }) {
  const mobileNav = MODULES.filter((n) => ['dashboard', 'journal', 'analytics', 'accounts', 'chat', 'risk'].includes(n.key));
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileNav.map((n) => { const Icon = n.icon; const isActive = active === n.key; return (<button key={n.key} onClick={() => onSelect(n.key)} className={cn('flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors relative', isActive ? 'text-primary' : 'text-muted-foreground')}><Icon className="w-4 h-4" />{n.label.split(' ')[0]}{n.badge && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}</button>); })}
      </div>
    </div>
  );
}
