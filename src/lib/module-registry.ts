import {
  LayoutDashboard, BookOpen, BarChart3, Calculator, Sparkles, Target,
  CalendarDays, Newspaper, HeartPulse, Plug, MessageSquare, Trophy,
  Brain, Crosshair, Layers, Building2, LineChart, Settings, ShieldCheck,
  Network, Wallet, type LucideIcon,
} from 'lucide-react';

export type ModuleKey =
  | 'dashboard' | 'journal' | 'analytics' | 'risk' | 'coach' | 'chat'
  | 'achievements' | 'plan' | 'psychology' | 'calendar' | 'news' | 'brokers'
  | 'accounts'
  | 'strategy_intelligence' | 'decision_intelligence' | 'multi_account_intelligence'
  | 'prop_firms' | 'market_intelligence' | 'ai_intelligence' | 'settings' | 'admin';

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
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview', visibility: 'all', meta: { title: 'Dashboard', subtitle: 'Your trading command center' } },
  { key: 'journal', label: 'Trading Journal', icon: BookOpen, group: 'Overview', visibility: 'all', meta: { title: 'Trading Journal', subtitle: 'Every trade, fully documented' }, keywords: ['trades', 'log', 'entries'] },
  { key: 'analytics', label: 'Performance', icon: BarChart3, group: 'Overview', visibility: 'all', meta: { title: 'Performance Analytics', subtitle: 'Deep insights into your edge' }, keywords: ['stats', 'metrics'] },
  { key: 'coach', label: 'AI Coach', icon: Sparkles, group: 'Intelligence', visibility: 'all', meta: { title: 'AI Trading Coach', subtitle: 'Personalized insights to improve your trading' }, keywords: ['ai', 'coaching'] },
  { key: 'chat', label: 'AI Chat', icon: MessageSquare, group: 'Intelligence', visibility: 'all', badge: 'NEW', meta: { title: 'AI Trading Assistant', subtitle: 'Ask anything about your trades' }, keywords: ['chat', 'assistant'] },
  { key: 'psychology', label: 'Psychology', icon: HeartPulse, group: 'Intelligence', visibility: 'all', meta: { title: 'Trading Psychology', subtitle: 'Track and improve your mental game' }, keywords: ['mood', 'tilt', 'discipline'] },
  { key: 'achievements', label: 'Achievements', icon: Trophy, group: 'Intelligence', visibility: 'all', meta: { title: 'Achievements', subtitle: 'Gamified milestones for your trading journey' }, keywords: ['badges', 'goals'] },
  { key: 'strategy_intelligence', label: 'Strategy Intelligence', icon: Network, group: 'Intelligence', visibility: 'pro', meta: { title: 'Strategy Intelligence', subtitle: 'Deep strategy performance analysis' }, keywords: ['strategy', 'setup'], comingSoon: true },
  { key: 'decision_intelligence', label: 'Decision Intelligence', icon: Crosshair, group: 'Intelligence', visibility: 'pro', meta: { title: 'Decision Intelligence', subtitle: 'Pre-trade decision support engine' }, keywords: ['decision'], comingSoon: true },
  { key: 'market_intelligence', label: 'Market Intelligence', icon: LineChart, group: 'Intelligence', visibility: 'pro', meta: { title: 'Market Intelligence', subtitle: 'Market structure and sentiment analysis' }, keywords: ['market'], comingSoon: true },
  { key: 'ai_intelligence', label: 'AI Intelligence', icon: Brain, group: 'Intelligence', visibility: 'pro', meta: { title: 'AI Intelligence', subtitle: 'Advanced AI analysis and predictions' }, keywords: ['ai', 'ml'], comingSoon: true },
  { key: 'brokers', label: 'Broker Sync', icon: Plug, group: 'Connections', visibility: 'all', meta: { title: 'Broker Connections', subtitle: 'Auto-sync trades from your trading accounts' }, keywords: ['broker', 'mt4', 'mt5', 'binance'] },
  { key: 'accounts', label: 'Accounts', icon: Wallet, group: 'Connections', visibility: 'all', meta: { title: 'Trading Accounts', subtitle: 'Manage your trading accounts across brokers and prop firms' }, keywords: ['account', 'mt4', 'mt5', 'ctrader', 'demo', 'live', 'prop'] },
  { key: 'multi_account_intelligence', label: 'Multi-Account', icon: Layers, group: 'Connections', visibility: 'elite', meta: { title: 'Multi-Account Intelligence', subtitle: 'Aggregate analytics across all accounts' }, keywords: ['multi', 'aggregate'], comingSoon: true },
  { key: 'prop_firms', label: 'Prop Firms', icon: Building2, group: 'Connections', visibility: 'pro', meta: { title: 'Prop Firm Intelligence', subtitle: 'Track prop firm challenges and rules' }, keywords: ['ftmo', 'prop'], comingSoon: true },
  { key: 'risk', label: 'Risk Management', icon: Calculator, group: 'Tools', visibility: 'all', meta: { title: 'Risk Management', subtitle: 'Professional calculators for every position' }, keywords: ['risk', 'position size'] },
  { key: 'plan', label: 'Trading Plan', icon: Target, group: 'Tools', visibility: 'all', meta: { title: 'Trading Plan', subtitle: 'Define your rules, follow your plan' }, keywords: ['plan', 'rules'] },
  { key: 'calendar', label: 'Economic Calendar', icon: CalendarDays, group: 'Tools', visibility: 'all', meta: { title: 'Economic Calendar', subtitle: 'Market-moving events at a glance' }, keywords: ['calendar', 'events'] },
  { key: 'news', label: 'News Center', icon: Newspaper, group: 'Tools', visibility: 'all', meta: { title: 'News Center', subtitle: 'AI-curated financial news' }, keywords: ['news', 'headlines'] },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'System', visibility: 'all', meta: { title: 'Settings', subtitle: 'Configure your TraderOS workspace' }, keywords: ['settings', 'config'] },
  { key: 'admin', label: 'Admin', icon: ShieldCheck, group: 'System', visibility: 'admin', meta: { title: 'Admin Panel', subtitle: 'System administration' }, keywords: ['admin'], comingSoon: true },
];

export const MODULE_GROUPS: ModuleGroup[] = ['Overview', 'Intelligence', 'Connections', 'Tools', 'System'];

export const MODULE_MAP: Record<ModuleKey, ModuleMeta> = MODULES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m }), {} as Record<ModuleKey, ModuleMeta>
);

export function getModuleMeta(key: ModuleKey): ModuleMeta { return MODULE_MAP[key]; }

export function getVisibleModules(tier: 'free' | 'starter' | 'pro' | 'elite', isAdmin = false): ModuleMeta[] {
  return MODULES.filter((m) => {
    if (m.visibility === 'admin') return isAdmin;
    if (m.visibility === 'elite') return tier === 'elite';
    if (m.visibility === 'pro') return ['pro', 'elite'].includes(tier);
    return true;
  });
}
