'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar, MobileNav, type ModuleKey } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { Dashboard } from '@/components/modules/dashboard';
import { Journal } from '@/components/modules/journal';
import { Analytics } from '@/components/modules/analytics';
import { RiskManagement } from '@/components/modules/risk';
import { Coach } from '@/components/modules/coach';
import { AiChat } from '@/components/modules/chat';
import { Achievements } from '@/components/modules/achievements';
import { Plan } from '@/components/modules/plan';
import { Psychology } from '@/components/modules/psychology';
import { EconomicCalendar } from '@/components/modules/calendar';
import { NewsCenter } from '@/components/modules/news';
import { Brokers } from '@/components/modules/brokers';
import { AuthPage } from '@/components/auth-page';
import { PlanModal } from '@/components/plan-modal';
import { useAuth } from '@/components/auth-provider';
import { supabase, type Trade, type AiInsight, type OpenPosition, type TradingGoal } from '@/lib/supabase';
import { getModuleMeta } from '@/lib/module-registry';
import { emit } from '@/lib/event-bus';

export default function Home() {
  const { user, loading: authLoading, signOut, profile, subscription, refresh } = useAuth();
  const [active, setActive]     = useState<ModuleKey>('dashboard');
  const [trades, setTrades]     = useState<Trade[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [goals, setGoals]       = useState<TradingGoal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  const handleSelect = (key: ModuleKey) => {
    setActive(key);
    emit('module:changed', key);
  };

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading TraderOS…
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-primary underline underline-offset-2 mt-2"
          >
            Stuck? Click to retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const tier = subscription?.plan_tier || profile?.plan_tier || 'free';
  const { meta: { title, subtitle } } = getModuleMeta(active);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={active}
        onSelect={handleSelect}
        onShowPlans={() => setShowPlans(true)}
        onSignOut={signOut}
        profile={profile}
        tier={tier}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          onShowPlans={() => setShowPlans(true)}
          onOpenChat={() => handleSelect('chat')}
          onAdd={active === 'journal' ? () => {} : undefined}
        />

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8 overflow-x-hidden">
          {loading ? (
            <div className="grid place-items-center h-64">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading your trading workspace…
              </div>
            </div>
          ) : (
            <>
              {active === 'dashboard'    && <Dashboard trades={trades} insights={insights} positions={positions} goals={goals} />}
              {active === 'journal'      && <Journal trades={trades} onMutated={load} />}
              {active === 'analytics'   && <Analytics trades={trades} />}
              {active === 'risk'        && <RiskManagement />}
              {active === 'coach'       && <Coach trades={trades} insights={insights} onRegenerated={load} />}
              {active === 'chat'        && <AiChat trades={trades} />}
              {active === 'achievements' && <Achievements trades={trades} />}
              {active === 'plan'        && <Plan />}
              {active === 'psychology'  && <Psychology />}
              {active === 'calendar'    && <EconomicCalendar />}
              {active === 'news'        && <NewsCenter />}
              {active === 'brokers'     && <Brokers />}
            </>
          )}
        </main>
      </div>

      <MobileNav active={active} onSelect={handleSelect} />
      {showPlans && <PlanModal onClose={() => setShowPlans(false)} onUpgraded={refresh} />}
    </div>
  );
}
