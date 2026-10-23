'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Sidebar, MobileNav, type ModuleKey } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { CommandPalette } from '@/components/command-palette';
import { ComingSoon } from '@/components/modules/coming-soon';
import { AuthPage } from '@/components/auth-page';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { WorkspaceProvider } from '@/components/workspace-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TimezoneProvider } from '@/components/timezone-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { supabase, type Trade, type AiInsight, type OpenPosition, type TradingGoal } from '@/lib/supabase';
import { getModuleMeta } from '@/lib/module-registry';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';

const Dashboard = lazy(() => import('@/components/modules/dashboard').then(m => ({ default: m.Dashboard })));
const Journal = lazy(() => import('@/components/modules/journal').then(m => ({ default: m.Journal })));
const Analytics = lazy(() => import('@/components/modules/analytics').then(m => ({ default: m.Analytics })));
const RiskManagement = lazy(() => import('@/components/modules/risk').then(m => ({ default: m.RiskManagement })));
const Coach = lazy(() => import('@/components/modules/coach').then(m => ({ default: m.Coach })));
const AiChat = lazy(() => import('@/components/modules/chat').then(m => ({ default: m.AiChat })));
const AiIntelligence = lazy(() => import('@/components/modules/ai-intelligence').then(m => ({ default: m.AiIntelligence })));
const Achievements = lazy(() => import('@/components/modules/achievements').then(m => ({ default: m.Achievements })));
const Plan = lazy(() => import('@/components/modules/plan').then(m => ({ default: m.Plan })));
const Psychology = lazy(() => import('@/components/modules/psychology').then(m => ({ default: m.Psychology })));
const StrategyManagement = lazy(() => import('@/components/modules/strategy').then(m => ({ default: m.StrategyManagement })));
const MarketContext = lazy(() => import('@/components/modules/market-context').then(m => ({ default: m.MarketContext })));
const Brokers = lazy(() => import('@/components/modules/brokers').then(m => ({ default: m.Brokers })));
const Accounts = lazy(() => import('@/components/modules/accounts').then(m => ({ default: m.Accounts })));
const Settings = lazy(() => import('@/components/modules/settings').then(m => ({ default: m.Settings })));
const Reports = lazy(() => import('@/components/modules/reports').then(m => ({ default: m.Reports })));
const Automation = lazy(() => import('@/components/modules/automation').then(m => ({ default: m.Automation })));

function ModuleFallback() {
  return (
    <div className="grid place-items-center h-64">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Loading module…
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading: authLoading, signOut, profile, subscription, refresh } = useAuth();
  const [active, setActive] = useState<ModuleKey>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCommand, setShowCommand] = useState(false);

  const handleSelect = useCallback((key: ModuleKey) => {
    setActive(key);
    emit('module:changed', key, 'page');
    logger.info('Navigation', `Module changed: ${key}`);
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [t, i, p, g] = await Promise.all([
        supabase.from('trades').select('*').order('executed_at', { ascending: false }),
        supabase.from('ai_insights').select('*').order('created_at', { ascending: false }),
        supabase.from('open_positions').select('*').order('opened_at', { ascending: false }),
        supabase.from('trading_goals').select('*').order('created_at', { ascending: false }),
      ]);
      setTrades((t.data || []) as Trade[]);
      setInsights((i.data || []) as AiInsight[]);
      setPositions((p.data || []) as OpenPosition[]);
      setGoals((g.data || []) as TradingGoal[]);
      setLoading(false);
    } catch {
      setLoadError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  useEffect(() => {
    const handler = () => setShowCommand(true);
    window.addEventListener('traderos:open-command-palette', handler);
    return () => window.removeEventListener('traderos:open-command-palette', handler);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading TraderOS…
          <button onClick={() => window.location.reload()} className="text-xs text-primary underline underline-offset-2 mt-2">Stuck? Click to retry</button>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const tier = subscription?.plan_tier || profile?.plan_tier || 'free';
  const { meta: { title, subtitle } } = getModuleMeta(active);

  const renderModule = () => {
    switch (active) {
      case 'dashboard':    return <Dashboard trades={trades} insights={insights} positions={positions} goals={goals} onNavigate={handleSelect} />;
      case 'journal':      return <Journal trades={trades} onMutated={load} />;
      case 'analytics':    return <Analytics trades={trades} />;
      case 'risk':         return <RiskManagement trades={trades} />;
      case 'coach':        return <Coach trades={trades} insights={insights} onRegenerated={load} />;
      case 'chat':         return <AiChat trades={trades} />;
      case 'ai_intelligence': return <AiIntelligence trades={trades} />;
      case 'achievements': return <Achievements trades={trades} />;
      case 'plan':         return <Plan />;
      case 'psychology':   return <Psychology trades={trades} />;
      case 'strategy':     return <StrategyManagement trades={trades} />;
      case 'market_context': return <MarketContext />;
      case 'brokers':      return <Brokers trades={trades} onTradesUpdated={load} />;
      case 'accounts':     return <Accounts />;
      case 'reports':      return <Reports trades={trades} />;
      case 'automation':   return <Automation />;
      case 'settings':     return <Settings />;
      default:             return <ComingSoon moduleKey={active} />;
    }
  };

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <Sidebar active={active} onSelect={handleSelect} onShowPlans={() => {}} onSignOut={signOut} profile={profile} tier={tier} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title={title} subtitle={subtitle} active={active} onOpenChat={() => handleSelect('ai_intelligence')} onOpenSearch={() => setShowCommand(true)} onAdd={active === 'journal' ? () => emit('journal:add-trade', undefined, 'page') : undefined} onNavigateAccounts={() => handleSelect('accounts')} />
          <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8 overflow-x-hidden">
            {loading ? (
              <div className="grid place-items-center h-64"><div className="flex items-center gap-3 text-muted-foreground"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Loading your trading workspace…</div></div>
            ) : loadError ? (
              <div className="grid place-items-center h-64 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Failed to load your trading data.</p>
                  <Button onClick={load} variant="outline" size="sm">Retry</Button>
                </div>
              </div>
            ) : (
              <Suspense fallback={<ModuleFallback />}>
                {renderModule()}
              </Suspense>
            )}
          </main>
        </div>
        <MobileNav active={active} onSelect={handleSelect} />
        <CommandPalette open={showCommand} onClose={() => setShowCommand(false)} onNavigate={handleSelect} onNewTrade={() => handleSelect('journal')} onImportTrades={() => handleSelect('brokers')} onOpenChat={() => handleSelect('ai_intelligence')} />
      </div>
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TimezoneProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TimezoneProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
