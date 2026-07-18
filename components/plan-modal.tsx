'use client';

import { useState } from 'react';
import { Check, X, Crown, Sparkles, Rocket, Zap } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase, type PlanTier } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Plan = {
  tier: PlanTier;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For traders just getting started',
    icon: Sparkles,
    accent: 'from-muted to-secondary',
    features: ['Trading journal (up to 50 trades)', 'Dashboard with key metrics', 'Basic risk calculators', '1 broker connection', 'Community access'],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: '$19',
    period: '/month',
    description: 'For active retail traders',
    icon: Zap,
    accent: 'from-primary to-chart-4',
    features: ['Unlimited trade journaling', 'Full performance analytics', 'All 9 risk calculators', '3 broker connections', 'Daily psychology check-ins', 'Email support'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For serious traders who want every edge',
    icon: Rocket,
    accent: 'from-primary to-success',
    popular: true,
    features: ['Everything in Starter', 'AI Trading Coach (unlimited)', 'Strategy × session analytics', 'Auto broker sync (10 connections)', 'Economic calendar + alerts', 'Priority support', 'Export to CSV / PDF'],
  },
  {
    tier: 'elite',
    name: 'Elite',
    price: '$149',
    period: '/month',
    description: 'For professionals and small funds',
    icon: Crown,
    accent: 'from-warning to-destructive',
    features: ['Everything in Pro', 'Unlimited broker connections', 'Multi-account aggregation', 'Custom AI insights + reports', 'API access', 'Dedicated account manager', 'Early access to new features'],
  },
];

export function PlanModal({ onClose, onUpgraded }: { onClose: () => void; onUpgraded?: () => void }) {
  const { profile, subscription } = useAuth();
  const currentTier = subscription?.plan_tier || profile?.plan_tier || 'free';
  const [busy, setBusy] = useState<PlanTier | null>(null);

  const upgrade = async (tier: PlanTier) => {
    if (tier === currentTier) { onClose(); return; }
    setBusy(tier);
    const userId = profile?.user_id;
    if (!userId) { setBusy(null); return; }
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_tier: tier,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });
    await supabase.from('profiles').update({ plan_tier: tier }).eq('user_id', userId);
    setBusy(null);
    onUpgraded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Choose your plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Upgrade anytime. Cancel anytime. Currently on <span className="text-primary font-medium capitalize">{currentTier}</span>.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const Icon = p.icon;
            const isCurrent = p.tier === currentTier;
            return (
              <div
                key={p.tier}
                className={cn(
                  'relative glass rounded-xl p-5 flex flex-col',
                  p.popular && 'border-primary ring-1 ring-primary/30'
                )}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className={cn('grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br text-white mb-3', p.accent)}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-semibold">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-2 text-xs mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => upgrade(p.tier)}
                  disabled={busy !== null || isCurrent}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                    isCurrent ? 'bg-secondary text-muted-foreground' : p.popular ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-secondary/60 border border-border hover:border-primary/40'
                  )}
                >
                  {busy === p.tier ? 'Processing...' : isCurrent ? 'Current plan' : 'Choose plan'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-6">
          Prices shown in USD. This is a demo — no payment is processed. Upgrading updates your account tier in the database.
        </p>
      </div>
    </div>
  );
}
