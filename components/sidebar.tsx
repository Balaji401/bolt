'use client';

import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Calculator,
  Brain,
  Target,
  CalendarDays,
  Newspaper,
  Sparkles,
  TrendingUp,
  HeartPulse,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModuleKey =
  | 'dashboard'
  | 'journal'
  | 'analytics'
  | 'risk'
  | 'coach'
  | 'plan'
  | 'psychology'
  | 'calendar'
  | 'news'
  | 'brokers';

const nav: { key: ModuleKey; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { key: 'journal', label: 'Trading Journal', icon: BookOpen, group: 'Overview' },
  { key: 'analytics', label: 'Performance', icon: BarChart3, group: 'Overview' },
  { key: 'coach', label: 'AI Coach', icon: Sparkles, group: 'Intelligence' },
  { key: 'psychology', label: 'Psychology', icon: HeartPulse, group: 'Intelligence' },
  { key: 'brokers', label: 'Broker Sync', icon: Plug, group: 'Connections' },
  { key: 'risk', label: 'Risk Management', icon: Calculator, group: 'Tools' },
  { key: 'plan', label: 'Trading Plan', icon: Target, group: 'Tools' },
  { key: 'calendar', label: 'Economic Calendar', icon: CalendarDays, group: 'Tools' },
  { key: 'news', label: 'News Center', icon: Newspaper, group: 'Tools' },
];

export function Sidebar({ active, onSelect }: { active: ModuleKey; onSelect: (k: ModuleKey) => void }) {
  const groups = Array.from(new Set(nav.map((n) => n.group)));
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-xl">
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
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {g}
            </div>
            <div className="space-y-1">
              {nav.filter((n) => n.group === g).map((n) => {
                const Icon = n.icon;
                const isActive = active === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => onSelect(n.key)}
                    className={cn(
                      'group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                    )}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="glass rounded-lg p-3 flex items-center gap-3">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-sm font-semibold">
            JT
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Jordan Trade</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" /> Pro Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ active, onSelect }: { active: ModuleKey; onSelect: (k: ModuleKey) => void }) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border">
      <div className="flex items-center justify-around px-2 py-1.5 overflow-x-auto scrollbar-thin">
        {nav.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onSelect(n.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {n.label.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
