'use client';

import {
  LayoutDashboard, BookOpen, BarChart3, Calculator, Sparkles, Target,
  CalendarDays, Newspaper, TrendingUp, HeartPulse, Plug, Crown, LogOut,
  User, MessageSquare, Trophy, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, PlanTier } from '@/lib/supabase';

export type ModuleKey =
  | 'dashboard'
  | 'journal'
  | 'analytics'
  | 'risk'
  | 'coach'
  | 'chat'
  | 'achievements'
  | 'plan'
  | 'psychology'
  | 'calendar'
  | 'news'
  | 'brokers';

const nav: {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  badge?: string;
}[] = [
  { key: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard, group: 'Overview' },
  { key: 'journal',      label: 'Trading Journal',   icon: BookOpen,        group: 'Overview' },
  { key: 'analytics',   label: 'Performance',        icon: BarChart3,       group: 'Overview' },
  { key: 'coach',       label: 'AI Coach',            icon: Sparkles,        group: 'Intelligence' },
  { key: 'chat',        label: 'AI Chat',             icon: MessageSquare,   group: 'Intelligence', badge: 'NEW' },
  { key: 'psychology',  label: 'Psychology',          icon: HeartPulse,      group: 'Intelligence' },
  { key: 'achievements',label: 'Achievements',        icon: Trophy,          group: 'Intelligence' },
  { key: 'brokers',     label: 'Broker Sync',         icon: Plug,            group: 'Connections' },
  { key: 'risk',        label: 'Risk Management',     icon: Calculator,      group: 'Tools' },
  { key: 'plan',        label: 'Trading Plan',        icon: Target,          group: 'Tools' },
  { key: 'calendar',    label: 'Economic Calendar',   icon: CalendarDays,    group: 'Tools' },
  { key: 'news',        label: 'News Center',         icon: Newspaper,       group: 'Tools' },
];

const TIER_COLORS: Record<PlanTier, string> = {
  free:    'text-muted-foreground',
  starter: 'text-chart-3',
  pro:     'text-primary',
  elite:   'text-warning',
};

export function Sidebar({
  active,
  onSelect,
  onShowPlans,
  onSignOut,
  profile,
  tier,
}: {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
  onShowPlans: () => void;
  onSignOut: () => void;
  profile: Profile | null;
  tier: PlanTier;
}) {
  const initials = (profile?.display_name || 'T')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const groups = Array.from(new Set(nav.map((n) => n.group)));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/40 blur-lg rounded-lg" />
          <div className="relative grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold tracking-tight text-foreground">TraderOS</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Operating System</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {g}
            </div>
            <div className="space-y-0.5">
              {nav.filter((n) => n.group === g).map((n) => {
                const Icon = n.icon;
                const isActive = active === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => onSelect(n.key)}
                    className={cn(
                      'group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                    )}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium flex-1 text-left">{n.label}</span>
                    {n.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wide">
                        {n.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={onShowPlans}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/15 to-chart-4/15 border border-primary/30 text-xs font-medium hover:border-primary/50 transition-colors"
        >
          <Crown className="w-3.5 h-3.5 text-warning" />
          <span className="flex-1 text-left">Upgrade plan</span>
          <span className={cn('text-[10px] uppercase tracking-widest capitalize font-semibold', TIER_COLORS[tier])}>
            {tierLabel}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="glass rounded-lg p-3 flex items-center gap-3">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground" />
              {profile?.display_name || 'Trader'}
            </div>
            <div className={cn('text-xs flex items-center gap-1', TIER_COLORS[tier])}>
              <Crown className="w-3 h-3" /> {tierLabel} plan
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  active,
  onSelect,
}: {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
}) {
  // Show a curated set of the most important modules in the mobile nav
  const mobileNav = nav.filter((n) =>
    ['dashboard', 'journal', 'analytics', 'chat', 'risk'].includes(n.key)
  );

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileNav.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onSelect(n.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {n.label.split(' ')[0]}
              {n.badge && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
