/**
 * TraderOS Module Registry
 * Centralized metadata for all feature modules.
 * Used by sidebar, topbar, and lazy-loading.
 */

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, BookOpen, BarChart3, Calculator, Sparkles, Target,
  CalendarDays, Newspaper, HeartPulse, Plug, MessageSquare, Trophy,
  type LucideIcon,
} from 'lucide-react';

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

export type ModuleGroup = 'Overview' | 'Intelligence' | 'Connections' | 'Tools';

export type ModuleMeta = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  group: ModuleGroup;
  badge?: string;
  meta: { title: string; subtitle: string };
};

export const MODULES: ModuleMeta[] = [
  { key: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard, group: 'Overview',    meta: { title: 'Dashboard',           subtitle: 'Your trading command center' } },
  { key: 'journal',      label: 'Trading Journal',   icon: BookOpen,        group: 'Overview',    meta: { title: 'Trading Journal',     subtitle: 'Every trade, fully documented' } },
  { key: 'analytics',    label: 'Performance',        icon: BarChart3,       group: 'Overview',    meta: { title: 'Performance Analytics', subtitle: 'Deep insights into your edge' } },
  { key: 'coach',        label: 'AI Coach',          icon: Sparkles,        group: 'Intelligence',meta: { title: 'AI Trading Coach',    subtitle: 'Personalized insights to improve your trading' } },
  { key: 'chat',         label: 'AI Chat',          icon: MessageSquare,   group: 'Intelligence',badge: 'NEW', meta: { title: 'AI Trading Assistant', subtitle: 'Ask anything about your trades — get instant answers' } },
  { key: 'psychology',   label: 'Psychology',        icon: HeartPulse,      group: 'Intelligence',meta: { title: 'Trading Psychology',  subtitle: 'Track and improve your mental game' } },
  { key: 'achievements', label: 'Achievements',      icon: Trophy,          group: 'Intelligence',meta: { title: 'Achievements',        subtitle: 'Gamified milestones for your trading journey' } },
  { key: 'brokers',      label: 'Broker Sync',       icon: Plug,            group: 'Connections', meta: { title: 'Broker Connections',  subtitle: 'Auto-sync trades from your trading accounts' } },
  { key: 'risk',         label: 'Risk Management',   icon: Calculator,      group: 'Tools',        meta: { title: 'Risk Management',     subtitle: 'Professional calculators for every position' } },
  { key: 'plan',         label: 'Trading Plan',      icon: Target,          group: 'Tools',        meta: { title: 'Trading Plan',        subtitle: 'Define your rules, follow your plan' } },
  { key: 'calendar',     label: 'Economic Calendar', icon: CalendarDays,   group: 'Tools',        meta: { title: 'Economic Calendar',   subtitle: 'Market-moving events at a glance' } },
  { key: 'news',         label: 'News Center',       icon: Newspaper,       group: 'Tools',        meta: { title: 'News Center',         subtitle: 'AI-curated financial news' } },
];

export const MODULE_GROUPS: ModuleGroup[] = ['Overview', 'Intelligence', 'Connections', 'Tools'];

export const MODULE_MAP: Record<ModuleKey, ModuleMeta> = MODULES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m }),
  {} as Record<ModuleKey, ModuleMeta>
);

export function getModuleMeta(key: ModuleKey): ModuleMeta {
  return MODULE_MAP[key];
}

// Lazy-loaded module components for code splitting
export const lazyModules: Record<ModuleKey, ComponentType<any>> = {
  dashboard:    dynamic(() => import('@/components/modules/dashboard').then(m => ({ default: m.Dashboard })), { loading: () => null }),
  journal:      dynamic(() => import('@/components/modules/journal').then(m => ({ default: m.Journal })), { loading: () => null }),
  analytics:    dynamic(() => import('@/components/modules/analytics').then(m => ({ default: m.Analytics })), { loading: () => null }),
  risk:         dynamic(() => import('@/components/modules/risk').then(m => ({ default: m.RiskManagement })), { loading: () => null }),
  coach:        dynamic(() => import('@/components/modules/coach').then(m => ({ default: m.Coach })), { loading: () => null }),
  chat:         dynamic(() => import('@/components/modules/chat').then(m => ({ default: m.AiChat })), { loading: () => null }),
  achievements: dynamic(() => import('@/components/modules/achievements').then(m => ({ default: m.Achievements })), { loading: () => null }),
  plan:         dynamic(() => import('@/components/modules/plan').then(m => ({ default: m.Plan })), { loading: () => null }),
  psychology:   dynamic(() => import('@/components/modules/psychology').then(m => ({ default: m.Psychology })), { loading: () => null }),
  calendar:     dynamic(() => import('@/components/modules/calendar').then(m => ({ default: m.EconomicCalendar })), { loading: () => null }),
  news:         dynamic(() => import('@/components/modules/news').then(m => ({ default: m.NewsCenter })), { loading: () => null }),
  brokers:      dynamic(() => import('@/components/modules/brokers').then(m => ({ default: m.Brokers })), { loading: () => null }),
};
