/**
 * TraderOS Module Registry
 * Centralized metadata for all feature modules — existing + enterprise.
 * Used by sidebar, topbar, breadcrumbs, search, and lazy-loading.
 */

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, BookOpen, BarChart3, Calculator, Sparkles, Target,
  CalendarDays, Newspaper, HeartPulse, Plug, MessageSquare, Trophy,
  Brain, Scale, Layers, Building2, LineChart, Settings, ShieldCheck,
  Crosshair, Network, type LucideIcon,
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
  | 'brokers'
  // Enterprise modules (future)
  | 'strategy_intelligence'
  | 'decision_intelligence'
  | 'multi_account_intelligence'
  | 'prop_firms'
  | 'market_intelligence'
  | 'ai_intelligence'
  | 'settings'
  | 'admin';

export type ModuleGroup = 'Overview' | 'Intelligence' | 'Connections' | 'Tools' | 'System';

export type ModuleVisibility = 'all' | 'pro' | 'elite' | 'admin';

export type ModuleMeta = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  group: ModuleGroup;
  badge?: string;
  visibility: ModuleVisibility;
  meta: { title: string; subtitle: string };
  keywords?: string[];
  comingSoon?: boolean;
};

export const MODULES: ModuleMeta[] = [
  // Overview
  { key: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard, group: 'Overview',    visibility: 'all',    meta: { title: 'Dashboard',           subtitle: 'Your trading command center' } },
  { key: 'journal',      label: 'Trading Journal',   icon: BookOpen,        group: 'Overview',    visibility: 'all',    meta: { title: 'Trading Journal',     subtitle: 'Every trade, fully documented' }, keywords: ['trades', 'log', 'entries'] },
  { key: 'analytics',    label: 'Performance',        icon: BarChart3,       group: 'Overview',    visibility: 'all',    meta: { title: 'Performance Analytics', subtitle: 'Deep insights into your edge' }, keywords: ['stats', 'metrics', 'performance'] },

  // Intelligence
  { key: 'coach',        label: 'AI Coach',          icon: Sparkles,        group: 'Intelligence',visibility: 'all',    meta: { title: 'AI Trading Coach',    subtitle: 'Personalized insights to improve your trading' }, keywords: ['ai', 'coaching', 'insights'] },
  { key: 'chat',         label: 'AI Chat',          icon: MessageSquare,   group: 'Intelligence',visibility: 'all', badge: 'NEW', meta: { title: 'AI Trading Assistant', subtitle: 'Ask anything about your trades — get instant answers' }, keywords: ['chat', 'assistant', 'ask'] },
  { key: 'psychology',   label: 'Psychology',        icon: HeartPulse,      group: 'Intelligence',visibility: 'all',    meta: { title: 'Trading Psychology',  subtitle: 'Track and improve your mental game' }, keywords: ['mood', 'tilt', 'discipline', 'emotions'] },
  { key: 'achievements', label: 'Achievements',      icon: Trophy,          group: 'Intelligence',visibility: 'all',    meta: { title: 'Achievements',        subtitle: 'Gamified milestones for your trading journey' }, keywords: ['badges', 'goals', 'milestones'] },
  { key: 'strategy_intelligence',  label: 'Strategy Intelligence',  icon: Network,    group: 'Intelligence', visibility: 'pro',    meta: { title: 'Strategy Intelligence',  subtitle: 'Deep strategy performance analysis' }, keywords: ['strategy', 'setup', 'edge'], comingSoon: true },
  { key: 'decision_intelligence',  label: 'Decision Intelligence',  icon: Crosshair,  group: 'Intelligence', visibility: 'pro',    meta: { title: 'Decision Intelligence',  subtitle: 'Pre-trade decision support engine' }, keywords: ['decision', 'pre-trade', 'checklist'], comingSoon: true },
  { key: 'market_intelligence',     label: 'Market Intelligence',     icon: LineChart,  group: 'Intelligence', visibility: 'pro',    meta: { title: 'Market Intelligence',     subtitle: 'Market structure and sentiment analysis' }, keywords: ['market', 'structure', 'sentiment'], comingSoon: true },
  { key: 'ai_intelligence',         label: 'AI Intelligence',         icon: Brain,      group: 'Intelligence', visibility: 'pro',    meta: { title: 'AI Intelligence',         subtitle: 'Advanced AI analysis and predictions' }, keywords: ['ai', 'ml', 'predictions'], comingSoon: true },

  // Connections
  { key: 'brokers',      label: 'Broker Sync',       icon: Plug,            group: 'Connections', visibility: 'all',    meta: { title: 'Broker Connections',  subtitle: 'Auto-sync trades from your trading accounts' }, keywords: ['broker', 'mt4', 'mt5', 'binance'] },
  { key: 'multi_account_intelligence', label: 'Multi-Account', icon: Layers,   group: 'Connections', visibility: 'elite',  meta: { title: 'Multi-Account Intelligence', subtitle: 'Aggregate analytics across all accounts' }, keywords: ['multi', 'aggregate', 'accounts'], comingSoon: true },
  { key: 'prop_firms',   label: 'Prop Firms',        icon: Building2,       group: 'Connections', visibility: 'pro',    meta: { title: 'Prop Firm Intelligence', subtitle: 'Track prop firm challenges and rules' }, keywords: ['ftmo', 'prop', 'challenge'], comingSoon: true },

  // Tools
  { key: 'risk',         label: 'Risk Management',   icon: Calculator,      group: 'Tools',        visibility: 'all',    meta: { title: 'Risk Management',     subtitle: 'Professional calculators for every position' }, keywords: ['risk', 'position size', 'margin'] },
  { key: 'plan',         label: 'Trading Plan',      icon: Target,          group: 'Tools',        visibility: 'all',    meta: { title: 'Trading Plan',        subtitle: 'Define your rules, follow your plan' }, keywords: ['plan', 'rules', 'checklist'] },
  { key: 'calendar',     label: 'Economic Calendar', icon: CalendarDays,   group: 'Tools',        visibility: 'all',    meta: { title: 'Economic Calendar',   subtitle: 'Market-moving events at a glance' }, keywords: ['calendar', 'events', 'news'] },
  { key: 'news',         label: 'News Center',       icon: Newspaper,       group: 'Tools',        visibility: 'all',    meta: { title: 'News Center',         subtitle: 'AI-curated financial news' }, keywords: ['news', 'headlines', 'sentiment'] },

  // System
  { key: 'settings',     label: 'Settings',         icon: Settings,        group: 'System',       visibility: 'all',    meta: { title: 'Settings',           subtitle: 'Configure your TraderOS workspace' }, keywords: ['settings', 'config', 'preferences'] },
  { key: 'admin',        label: 'Admin',            icon: ShieldCheck,     group: 'System',       visibility: 'admin',   meta: { title: 'Admin Panel',         subtitle: 'System administration' }, keywords: ['admin', 'system', 'management'], comingSoon: true },
];

export const MODULE_GROUPS: ModuleGroup[] = ['Overview', 'Intelligence', 'Connections', 'Tools', 'System'];

export const MODULE_MAP: Record<ModuleKey, ModuleMeta> = MODULES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m }),
  {} as Record<ModuleKey, ModuleMeta>
);

export function getModuleMeta(key: ModuleKey): ModuleMeta {
  return MODULE_MAP[key];
}

export function getVisibleModules(tier: 'free' | 'starter' | 'pro' | 'elite', isAdmin = false): ModuleMeta[] {
  return MODULES.filter((m) => {
    if (m.visibility === 'admin') return isAdmin;
    if (m.visibility === 'elite') return tier === 'elite';
    if (m.visibility === 'pro') return ['pro', 'elite'].includes(tier);
    return true;
  });
}

// Lazy-loaded module components for code splitting
// Existing modules are lazy-loaded; future modules render a placeholder
const ComingSoon = dynamic(() => import('@/components/modules/coming-soon').then(m => ({ default: m.ComingSoon })), { loading: () => null });

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
  // Enterprise modules — render coming soon placeholder
  strategy_intelligence:       ComingSoon,
  decision_intelligence:       ComingSoon,
  multi_account_intelligence:  ComingSoon,
  prop_firms:                  ComingSoon,
  market_intelligence:         ComingSoon,
  ai_intelligence:             ComingSoon,
  settings:                    ComingSoon,
  admin:                       ComingSoon,
};
