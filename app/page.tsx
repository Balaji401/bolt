'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar, MobileNav, type ModuleKey } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { Dashboard } from '@/components/modules/dashboard';
import { Journal } from '@/components/modules/journal';
import { Analytics } from '@/components/modules/analytics';
import { RiskManagement } from '@/components/modules/risk';
import { Coach } from '@/components/modules/coach';
import { Plan } from '@/components/modules/plan';
import { Psychology } from '@/components/modules/psychology';
import { EconomicCalendar } from '@/components/modules/calendar';
import { NewsCenter } from '@/components/modules/news';
import { Brokers } from '@/components/modules/brokers';
import { supabase, type Trade, type AiInsight, type OpenPosition, type TradingGoal } from '@/lib/supabase';

const META: Record<ModuleKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your trading command center' },
  journal: { title: 'Trading Journal', subtitle: 'Every trade, fully documented' },
  analytics: { title: 'Performance Analytics', subtitle: 'Deep insights into your edge' },
  risk: { title: 'Risk Management', subtitle: 'Professional calculators for every position' },
  coach: { title: 'AI Trading Coach', subtitle: 'Personalized insights to improve your trading' },
  plan: { title: 'Trading Plan', subtitle: 'Define your rules, follow your plan' },
  psychology: { title: 'Trading Psychology', subtitle: 'Track and improve your mental game' },
  calendar: { title: 'Economic Calendar', subtitle: 'Market-moving events at a glance' },
  news: { title: 'News Center', subtitle: 'AI-curated financial news' },
  brokers: { title: 'Broker Connections', subtitle: 'Auto-sync trades from your trading accounts' },
};

export default function Home() {
  const [active, setActive] = useState<ModuleKey>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} onSelect={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={META[active].title} subtitle={META[active].subtitle} />
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8 overflow-x-hidden">
          {loading ? (
            <div className="grid place-items-center h-64">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading your trading workspace...
              </div>
            </div>
          ) : (
            <>
              {active === 'dashboard' && <Dashboard trades={trades} insights={insights} positions={positions} goals={goals} />}
              {active === 'journal' && <Journal trades={trades} onMutated={load} />}
              {active === 'analytics' && <Analytics trades={trades} />}
              {active === 'risk' && <RiskManagement />}
              {active === 'coach' && <Coach trades={trades} insights={insights} />}
              {active === 'plan' && <Plan />}
              {active === 'psychology' && <Psychology />}
              {active === 'calendar' && <EconomicCalendar />}
              {active === 'news' && <NewsCenter />}
              {active === 'brokers' && <Brokers />}
            </>
          )}
        </main>
      </div>
      <MobileNav active={active} onSelect={setActive} />
    </div>
  );
}
