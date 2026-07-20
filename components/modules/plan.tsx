'use client';

import { useEffect, useState } from 'react';
import {
  Target, Plus, Check, X, Shield, ListChecks, Calendar, Sparkles,
  BookOpen, Zap, Rocket, Crown, ChevronDown, ChevronUp, TrendingUp,
  AlertTriangle, Clock, DollarSign,
} from 'lucide-react';
import { supabase, type TradingPlan, type PlanTier } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { fmtCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

// ── Sample plans indexed by tier ──────────────────────────────────────────────
type SamplePlan = Omit<TradingPlan, 'id' | 'active'>;

const SAMPLE_PLANS: Record<string, SamplePlan[]> = {
  free: [
    {
      plan_type: 'daily',
      title: 'Simple Daily Plan — Beginner',
      max_daily_loss: 100,
      max_weekly_loss: 400,
      max_risk_per_trade: 1,
      entry_checklist: ['Price at key support or resistance', 'Candle close confirms direction', 'Risk under 1%'],
      exit_checklist: ['Hit take-profit target', 'Stop-loss triggered', 'End of session — flat all positions'],
      session_checklist: ['London open (8–10 AM GMT)', 'New York open (1–3 PM GMT)'],
      rules: ['Max 2 trades per day', 'No trading after 1 loss', 'Journal every trade'],
      goals: ['Reach a 50% win rate', 'Complete 20 journaled trades'],
    },
  ],
  starter: [
    {
      plan_type: 'daily',
      title: 'Trend-Following Daily Plan',
      max_daily_loss: 200,
      max_weekly_loss: 800,
      max_risk_per_trade: 1.5,
      entry_checklist: ['Higher-timeframe trend aligned', 'Entry on pullback to 20 EMA', 'RSI between 40–60 on entry', 'No major news within 30 min', 'Risk under 1.5%'],
      exit_checklist: ['Partial profit at 1:1 R:R', 'Trail stop to breakeven at 1.5R', 'Full exit at 2R target or EOD'],
      session_checklist: ['London session open', 'New York open overlap (1–3 PM GMT)', 'Avoid Asia unless momentum trade'],
      rules: ['Max 3 trades per day', 'No revenge trading after 2 losses', 'Only trade your top 3 instruments', 'Log every trade with emotion tag'],
      goals: ['Achieve 55% win rate', 'Keep avg R:R above 1.5', 'Max drawdown under 5%'],
    },
    {
      plan_type: 'weekly',
      title: 'Weekly Swing Plan — Starter',
      max_daily_loss: 300,
      max_weekly_loss: 1000,
      max_risk_per_trade: 2,
      entry_checklist: ['Weekly trend confirmed on H4', 'Price consolidating near key level', 'Volume confirms breakout or rejection', 'Risk defined before entry'],
      exit_checklist: ['Scale out 50% at 2R', 'Move stop to breakeven', 'Let remaining 50% run to 4R'],
      session_checklist: ['Check charts Monday 8 AM', 'Review mid-week Wednesday', 'Close all trades Friday 4 PM'],
      rules: ['Max 5 open positions at once', 'No trades on major NFP/FOMC days', 'Set alerts — do not watch charts all day'],
      goals: ['4–6 quality swing trades per week', 'Profit factor above 1.5'],
    },
  ],
  pro: [
    {
      plan_type: 'daily',
      title: 'ICT / Smart Money Daily Plan — Pro',
      max_daily_loss: 500,
      max_weekly_loss: 1500,
      max_risk_per_trade: 1.5,
      entry_checklist: ['Identify HTF premium/discount zone', 'Mark order blocks and breaker blocks', 'Wait for displacement candle', 'Confirm FVG (Fair Value Gap) fill', 'Entry at OTE (Optimal Trade Entry) 62–79%', 'Risk under 1.5%', 'No entry during NY lunch (12–1 PM EST)'],
      exit_checklist: ['First TP at nearest liquidity pool', 'Second TP at buyside/sellside liquidity', 'Trail via swing lows/highs', 'Flat before major macro events'],
      session_checklist: ['London KZ: 7–9 AM GMT', 'New York AM: 9:30–11 AM EST', 'New York PM: 1:30–3 PM EST', 'Avoid pre/post market extremes'],
      rules: ['Max 3 setup types per day (no FOMO trades)', 'No trading outside killzones', 'Screenshot entry and exit every trade', 'Review session replay after close', 'Max 2 losses = walk away for the day'],
      goals: ['60%+ win rate on A+ setups', 'Average R:R above 2.5', 'Drawdown never exceeds 3% in one day'],
    },
    {
      plan_type: 'weekly',
      title: 'Multi-Session Weekly Plan — Pro',
      max_daily_loss: 600,
      max_weekly_loss: 2000,
      max_risk_per_trade: 2,
      entry_checklist: ['Weekly and daily bias confirmed', 'H4 structure break in bias direction', 'H1 entry model (BOS + retest)', 'Correlating pair confirmation', 'News risk assessed'],
      exit_checklist: ['50% off at 2R — move to breakeven', 'Second 25% at 4R', 'Final 25% to weekly target or key level'],
      session_checklist: ['Monday: bias and HTF levels', 'Tue–Thu: active trading', 'Friday: close by 12 PM EST — no new entries'],
      rules: ['No more than 2 correlated pairs open simultaneously', 'Review week every Sunday — log in journal', 'Only A and B setups — no C setups'],
      goals: ['Consistent 5–10% monthly return', 'Risk-adjusted Sharpe ratio above 1.5'],
    },
    {
      plan_type: 'monthly',
      title: 'Monthly Accountability Plan — Pro',
      max_daily_loss: 600,
      max_weekly_loss: 2000,
      max_risk_per_trade: 2,
      entry_checklist: ['Monthly bias set on first Sunday', 'Key macro events mapped for the month', 'Priority instruments chosen (max 4)', 'Risk budget allocated per week'],
      exit_checklist: ['Close all positions last day of month', 'Review equity curve vs target', 'Adjust position sizing for next month'],
      session_checklist: ['Set weekly goals each Monday', 'Mid-month review — adjust if off track', 'End-of-month deep review session'],
      rules: ['If monthly max drawdown hit — reduce size by 50%', 'Review strategy effectiveness every 20 trades', 'Score every trade 1–10 in journal'],
      goals: ['Monthly profit target: 8–12%', 'Max monthly drawdown: 8%', 'Complete all journal entries'],
    },
  ],
  elite: [
    {
      plan_type: 'daily',
      title: 'Institutional Edge Daily Plan — Elite',
      max_daily_loss: 1000,
      max_weekly_loss: 4000,
      max_risk_per_trade: 1,
      entry_checklist: ['COT report sentiment aligned', 'DXY correlation confirmed', 'Market structure shift on M15 minimum', 'Orderflow imbalance identified', 'Entry at POI with confluence (OB + FVG + Liquidity)', 'Risk 0.5–1% per trade', 'No entries during news ±5 minutes'],
      exit_checklist: ['Scale into position using runners', 'First TP clears immediate liquidity', 'Runners trail using structure', 'Time-based close if no momentum by EOD'],
      session_checklist: ['Pre-London prep: 6:30–7 AM GMT', 'London KZ: 7–9 AM GMT', 'NY KZ: 9:30–11 AM / 1:30–3 PM EST', 'Asian range: midnight–2 AM GMT (swing only)'],
      rules: ['Single trade per instrument — no averaging', 'Daily loss limit = hard stop (auto-close)', 'Use correlation matrix — no 3+ correlated positions', 'Monthly review with external accountability partner', 'Record and review every session video'],
      goals: ['Institutional-grade 60–65% win rate', 'Profit factor above 3', 'Max monthly drawdown 5%', 'Annualized return target 80–120%'],
    },
    {
      plan_type: 'weekly',
      title: 'Multi-Asset Swing Plan — Elite',
      max_daily_loss: 1500,
      max_weekly_loss: 5000,
      max_risk_per_trade: 2,
      entry_checklist: ['Cross-asset analysis (equities, bonds, commodities)', 'COT positioning supports trade direction', 'Intermarket correlation check', 'Position sizing via Kelly Criterion (capped at 2%)'],
      exit_checklist: ['Partial profit every R milestone', 'Portfolio heat check before scaling', 'Systematic trailing stop algorithm'],
      session_checklist: ['Sunday: full market analysis + watchlist', 'Daily 15-min morning brief', 'End-of-day review + journal update'],
      rules: ['Max portfolio heat 6% at any time', 'Quarterly strategy audit', 'API-sync all trades for automated reporting'],
      goals: ['Quarterly return 20–30%', 'Sharpe ratio above 2', 'Consistent execution across all market conditions'],
    },
    {
      plan_type: 'monthly',
      title: 'Fund Management Monthly Plan — Elite',
      max_daily_loss: 2000,
      max_weekly_loss: 6000,
      max_risk_per_trade: 1,
      entry_checklist: ['Monthly macro thesis defined', 'Sector rotation analysis complete', 'Risk budget split across strategies', 'Drawdown limits set per strategy'],
      exit_checklist: ['Monthly rebalancing on last Friday', 'All sub-strategies reviewed vs benchmark', 'Capital allocation adjusted for next month'],
      session_checklist: ['Weekly portfolio review every Monday', 'Monthly investor report prepared', 'Stress test against historical drawdowns'],
      rules: ['Never exceed monthly risk budget', 'Full trade log available for audit at any time', 'Emergency halt if 10% monthly drawdown triggered'],
      goals: ['Annual target: 80%+ return', 'Max annual drawdown 15%', 'Consistent month-over-month growth'],
    },
  ],
};

// ── Tier UI helpers ────────────────────────────────────────────────────────────
const TIER_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; sampleCount: number }> = {
  free:    { label: 'Free',    icon: Sparkles,  color: 'text-muted-foreground', sampleCount: 1 },
  starter: { label: 'Starter', icon: Zap,       color: 'text-chart-3',          sampleCount: 2 },
  pro:     { label: 'Pro',     icon: Rocket,    color: 'text-primary',           sampleCount: 3 },
  elite:   { label: 'Elite',   icon: Crown,     color: 'text-warning',           sampleCount: 3 },
};

function getTierSamples(tier: PlanTier): SamplePlan[] {
  // Higher tiers include lower tier samples too
  if (tier === 'elite') return [...SAMPLE_PLANS.elite];
  if (tier === 'pro')   return [...SAMPLE_PLANS.pro];
  if (tier === 'starter') return [...SAMPLE_PLANS.starter];
  return SAMPLE_PLANS.free;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Plan() {
  const { subscription, profile } = useAuth();
  const tier = (subscription?.plan_tier || profile?.plan_tier || 'free') as PlanTier;

  const [plans, setPlans]         = useState<TradingPlan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('trading_plan').select('*').order('created_at', { ascending: false });
    setPlans((data || []) as TradingPlan[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const importSample = async (sample: SamplePlan) => {
    const key = sample.title;
    setLoadingId(key);
    await supabase.from('trading_plan').insert({
      ...sample,
      active: true,
      entry_checklist:   JSON.stringify(sample.entry_checklist),
      exit_checklist:    JSON.stringify(sample.exit_checklist),
      session_checklist: JSON.stringify(sample.session_checklist),
      rules:             JSON.stringify(sample.rules),
      goals:             sample.goals ?? [],
    });
    setLoadingId(null);
    setShowSamples(false);
    load();
  };

  const samples = getTierSamples(tier);
  const tierMeta = TIER_META[tier] || TIER_META.free;
  const TierIcon = tierMeta.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatTile icon={Shield}     label="Max Daily Loss"  value={fmtCurrency(500)}  tone="destructive" />
        <StatTile icon={Target}     label="Max Risk / Trade" value="1.5%"             tone="warning"     />
        <StatTile icon={Calendar}   label="Weekly Target"   value={fmtCurrency(2000)} tone="success"     />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold">Your Trading Plans</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSamples(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border text-sm font-medium hover:border-primary/40 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            Sample Plans
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 ml-0.5', tierMeta.color)}>
              {samples.length}
            </span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Plans list */}
      {loading ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No trading plans yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create your own plan or import a sample plan tailored to your <span className={cn('font-semibold', tierMeta.color)}>{tierMeta.label}</span> tier.
          </p>
          <button
            onClick={() => setShowSamples(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <BookOpen className="w-4 h-4" /> Browse Sample Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((p) => <PlanCard key={p.id} plan={p} onChange={load} />)}
        </div>
      )}

      {/* Sample plans modal */}
      {showSamples && (
        <SamplesModal
          samples={samples}
          tier={tier}
          tierMeta={tierMeta}
          loadingId={loadingId}
          onImport={importSample}
          onClose={() => setShowSamples(false)}
        />
      )}

      {/* New plan form */}
      {showForm && <PlanForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

// ── Sample Plans Modal ─────────────────────────────────────────────────────────
function SamplesModal({
  samples, tier, tierMeta, loadingId, onImport, onClose,
}: {
  samples: SamplePlan[];
  tier: PlanTier;
  tierMeta: typeof TIER_META[string];
  loadingId: string | null;
  onImport: (s: SamplePlan) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const TierIcon = tierMeta.icon;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TierIcon className={cn('w-4 h-4', tierMeta.color)} />
              <span className={cn('text-xs font-semibold uppercase tracking-widest', tierMeta.color)}>{tierMeta.label} tier</span>
            </div>
            <h2 className="text-lg font-semibold">Sample Trading Plans</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {samples.length} professional plan{samples.length !== 1 ? 's' : ''} included with your {tierMeta.label} plan. Click any plan to preview and import.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          {samples.map((sample) => {
            const isExpanded = expanded === sample.title;
            const isLoading = loadingId === sample.title;
            const typeColor = sample.plan_type === 'daily' ? 'text-primary bg-primary/10' : sample.plan_type === 'weekly' ? 'text-success bg-success/10' : 'text-chart-4 bg-chart-4/10';
            return (
              <div key={sample.title} className="glass rounded-xl border border-border overflow-hidden">
                {/* Plan header */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : sample.title)}
                >
                  <div className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0 text-sm font-bold', typeColor)}>
                    {sample.plan_type === 'daily' ? <Clock className="w-4 h-4" /> : sample.plan_type === 'weekly' ? <Calendar className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded', typeColor)}>
                        {sample.plan_type}
                      </span>
                      <h4 className="text-sm font-semibold">{sample.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {sample.max_daily_loss != null && (
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-destructive" />Daily loss: {fmtCurrency(sample.max_daily_loss)}</span>
                      )}
                      {sample.max_risk_per_trade != null && (
                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" />Risk/trade: {sample.max_risk_per_trade}%</span>
                      )}
                      <span className="flex items-center gap-1"><ListChecks className="w-3 h-3 text-primary" />{(sample.entry_checklist || []).length} entry rules</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onImport(sample); }}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isLoading ? 'Importing...' : 'Import'}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded preview */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4 animate-fade-in">
                    {/* Risk params */}
                    <div className="grid grid-cols-3 gap-2">
                      {sample.max_daily_loss != null && <Mini label="Max Daily Loss" value={fmtCurrency(sample.max_daily_loss)} />}
                      {sample.max_weekly_loss != null && <Mini label="Max Weekly Loss" value={fmtCurrency(sample.max_weekly_loss)} />}
                      {sample.max_risk_per_trade != null && <Mini label="Risk / Trade" value={`${sample.max_risk_per_trade}%`} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'entry_checklist',   title: 'Entry Checklist',   icon: Check },
                        { key: 'exit_checklist',    title: 'Exit Checklist',    icon: Target },
                        { key: 'session_checklist', title: 'Sessions',          icon: Clock },
                        { key: 'rules',             title: 'Trading Rules',     icon: Shield },
                      ].map(({ key, title, icon: Icon }) => {
                        const items = (sample as Record<string, any>)[key] as string[];
                        if (!items?.length) return null;
                        return (
                          <div key={key}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
                            </div>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <span className="text-primary mt-0.5">·</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {sample.goals?.length ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target className="w-3.5 h-3.5 text-warning" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Goals</span>
                        </div>
                        <ul className="space-y-1">
                          {sample.goals.map((g) => (
                            <li key={g} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="text-warning mt-0.5">·</span>{g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <button
                      onClick={() => onImport(sample)}
                      disabled={loadingId === sample.title}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {loadingId === sample.title ? 'Importing...' : `Import "${sample.title}" to My Plans`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upgrade nudge for lower tiers */}
        {tier === 'free' && (
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Unlock more sample plans</p>
              <p className="text-xs text-muted-foreground">Starter: 2 plans · Pro: 3 plans · Elite: 3 institutional-grade plans</p>
            </div>
          </div>
        )}
        {tier === 'starter' && (
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
            <Rocket className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Upgrade to Pro or Elite</p>
              <p className="text-xs text-muted-foreground">Pro includes ICT/Smart Money plans. Elite includes institutional-grade fund management plans.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onChange }: { plan: TradingPlan; onChange: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const toggle = (list: string, item: string) => setChecked((c) => ({ ...c, [`${list}:${item}`]: !c[`${list}:${item}`] }));

  const parseList = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const lists: { key: keyof TradingPlan; title: string }[] = [
    { key: 'entry_checklist', title: 'Entry Checklist' },
    { key: 'exit_checklist', title: 'Exit Checklist' },
    { key: 'session_checklist', title: 'Session Checklist' },
    { key: 'rules', title: 'Trading Rules' },
  ];

  const totalItems = lists.reduce((s, l) => s + parseList(plan[l.key]).length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded', plan.plan_type === 'daily' ? 'bg-primary/15 text-primary' : plan.plan_type === 'weekly' ? 'bg-success/15 text-success' : 'bg-chart-4/15 text-chart-4')}>
              {plan.plan_type}
            </span>
            {plan.active && <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-success/15 text-success">Active</span>}
            {totalItems > 0 && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {checkedCount}/{totalItems} checked
              </span>
            )}
          </div>
          <h3 className="font-semibold mt-2">{plan.title}</h3>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => setCollapsed((v) => !v)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={async () => { await supabase.from('trading_plan').delete().eq('id', plan.id); onChange(); }}
            className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(plan.max_daily_loss || plan.max_weekly_loss || plan.max_risk_per_trade) && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {plan.max_daily_loss != null && <Mini label="Max Daily Loss" value={fmtCurrency(Number(plan.max_daily_loss))} />}
          {plan.max_weekly_loss != null && <Mini label="Max Weekly Loss" value={fmtCurrency(Number(plan.max_weekly_loss))} />}
          {plan.max_risk_per_trade != null && <Mini label="Risk / Trade" value={`${plan.max_risk_per_trade}%`} />}
        </div>
      )}

      {!collapsed && (
        <div className="space-y-4">
          {lists.map(({ key, title }) => {
            const items = parseList(plan[key]);
            if (!items.length) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item: string) => {
                    const k = `${key}:${item}`;
                    return (
                      <button key={item} onClick={() => toggle(key, item)} className="flex items-center gap-2 w-full text-left text-sm group">
                        <span className={cn('grid place-items-center w-4 h-4 rounded border transition-colors shrink-0', checked[k] ? 'bg-success border-success' : 'border-border group-hover:border-primary')}>
                          {checked[k] && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className={cn(checked[k] && 'line-through text-muted-foreground')}>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'success' | 'warning' | 'destructive' }) {
  const toneMap: Record<string, string> = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' };
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="grid place-items-center w-10 h-10 rounded-lg bg-secondary/60">
        <Icon className={cn('w-5 h-5', toneMap[tone])} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={cn('text-lg font-semibold', toneMap[tone])}>{value}</div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

// ── New plan form ─────────────────────────────────────────────────────────────
function PlanForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    plan_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    title: '',
    max_daily_loss: '500',
    max_weekly_loss: '2000',
    max_risk_per_trade: '1.5',
    entry_checklist: 'Trend alignment on higher timeframe\nClear support/resistance level\nRisk under 1.5%\nNo major news within 30 min',
    exit_checklist: 'Hit target or stop\nTrailing stop in profit\nTime-based exit after 4 hours',
    session_checklist: 'London open\nNew York open',
    rules: 'No revenge trading\nMax 5 trades per day\nNo trading after 2 losses in a row',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('trading_plan').insert({
      plan_type: form.plan_type,
      title: form.title || `${form.plan_type} plan`,
      max_daily_loss: Number(form.max_daily_loss) || null,
      max_weekly_loss: Number(form.max_weekly_loss) || null,
      max_risk_per_trade: Number(form.max_risk_per_trade) || null,
      entry_checklist:   JSON.stringify(form.entry_checklist.split('\n').filter(Boolean)),
      exit_checklist:    JSON.stringify(form.exit_checklist.split('\n').filter(Boolean)),
      session_checklist: JSON.stringify(form.session_checklist.split('\n').filter(Boolean)),
      rules:             JSON.stringify(form.rules.split('\n').filter(Boolean)),
      goals: [],
      active: true,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Trading Plan</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">Plan Type</span>
              <select value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value as any })} className="input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">Title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. London breakout plan" className="input" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Max Daily Loss ($)</span><input type="number" value={form.max_daily_loss} onChange={(e) => setForm({ ...form, max_daily_loss: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Max Weekly Loss ($)</span><input type="number" value={form.max_weekly_loss} onChange={(e) => setForm({ ...form, max_weekly_loss: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Risk / Trade (%)</span><input type="number" value={form.max_risk_per_trade} onChange={(e) => setForm({ ...form, max_risk_per_trade: e.target.value })} className="input" /></label>
          </div>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Entry Checklist (one per line)</span><textarea value={form.entry_checklist} onChange={(e) => setForm({ ...form, entry_checklist: e.target.value })} rows={4} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Exit Checklist</span><textarea value={form.exit_checklist} onChange={(e) => setForm({ ...form, exit_checklist: e.target.value })} rows={3} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Session Checklist</span><textarea value={form.session_checklist} onChange={(e) => setForm({ ...form, session_checklist: e.target.value })} rows={2} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Trading Rules</span><textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3} className="input resize-none" /></label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
