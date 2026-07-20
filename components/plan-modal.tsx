'use client';

import { useState } from 'react';
import { Check, X, Crown, Sparkles, Rocket, Zap, CreditCard, Shield, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
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
    features: ['Trading journal (up to 50 trades)', 'Dashboard with key metrics', 'Basic risk calculators (3 of 9)', '1 broker connection', 'Community access'],
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
    features: ['Everything in Starter', 'AI Trading Coach (unlimited)', 'AI Chat with OpenAI integration', 'Strategy × session analytics', 'Auto broker sync (10 connections)', 'Economic calendar + alerts', 'Priority support', 'Export to CSV / PDF'],
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

const COMPARISON_FEATURES = [
  { label: 'Trade journal', free: '50 trades', starter: 'Unlimited', pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'Dashboard metrics', free: 'Basic', starter: 'Full', pro: 'Full', elite: 'Full' },
  { label: 'Risk calculators', free: '3 of 9', starter: 'All 9', pro: 'All 9', elite: 'All 9' },
  { label: 'Broker connections', free: '1', starter: '3', pro: '10', elite: 'Unlimited' },
  { label: 'AI Trading Coach', free: false, starter: false, pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'AI Chat (OpenAI)', free: 'Fallback', starter: 'Fallback', pro: 'Full AI', elite: 'Full AI' },
  { label: 'Strategy × Session matrix', free: false, starter: false, pro: true, elite: true },
  { label: 'Psychology tracker', free: false, starter: 'Daily', pro: 'Daily', elite: 'Daily' },
  { label: 'Economic calendar', free: 'View only', starter: 'View only', pro: 'View + alerts', elite: 'View + alerts' },
  { label: 'Export (CSV / PDF)', free: false, starter: false, pro: true, elite: true },
  { label: 'Multi-account aggregation', free: false, starter: false, pro: false, elite: true },
  { label: 'API access', free: false, starter: false, pro: false, elite: true },
  { label: 'Priority support', free: false, starter: 'Email', pro: 'Priority', elite: 'Dedicated manager' },
];

type Step = 'plans' | 'compare' | 'payment' | 'processing' | 'success';

export function PlanModal({ onClose, onUpgraded }: { onClose: () => void; onUpgraded?: () => void }) {
  const { profile, subscription } = useAuth();
  const currentTier = subscription?.plan_tier || profile?.plan_tier || 'free';
  const [busy, setBusy] = useState<PlanTier | null>(null);
  const [step, setStep] = useState<Step>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const getPrice = (plan: Plan) => {
    if (plan.tier === 'free') return 0;
    const monthly = parseInt(plan.price.replace('$', ''));
    if (billingCycle === 'yearly') return monthly * 10; // 2 months free
    return monthly;
  };

  const upgrade = async (tier: PlanTier) => {
    if (tier === currentTier) { onClose(); return; }
    setBusy(tier);
    setSelectedPlan(tier);
    setStep('processing');

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1500));

    const userId = profile?.user_id;
    if (!userId) { setBusy(null); setStep('plans'); return; }

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_tier: tier,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });
    await supabase.from('profiles').update({ plan_tier: tier }).eq('user_id', userId);

    setStep('success');
    setBusy(null);

    setTimeout(() => {
      onUpgraded?.();
      onClose();
    }, 2000);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {step === 'plans' && 'Choose your plan'}
              {step === 'compare' && 'Compare plans'}
              {step === 'payment' && 'Payment'}
              {step === 'processing' && 'Processing payment...'}
              {step === 'success' && 'Welcome to your new plan!'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'plans' && <>Upgrade anytime. Cancel anytime. Currently on <span className="text-primary font-medium capitalize">{currentTier}</span>.</>}
              {step === 'compare' && 'See exactly what each plan includes'}
              {step === 'payment' && selectedPlan && `Complete your upgrade to ${PLANS.find((p) => p.tier === selectedPlan)?.name}`}
              {step === 'processing' && 'Please wait while we process your payment'}
              {step === 'success' && 'Your subscription has been activated'}
            </p>
          </div>
          {step !== 'processing' && step !== 'success' && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
          )}
        </div>

        {/* Step: Plans */}
        {step === 'plans' && (
          <>
            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground')}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground')}
              >
                Yearly
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success font-semibold">Save 17%</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((p) => {
                const Icon = p.icon;
                const isCurrent = p.tier === currentTier;
                const price = getPrice(p);
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
                      <span className="text-2xl font-semibold">
                        {p.tier === 'free' ? '$0' : `$${price}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.tier === 'free' ? 'forever' : billingCycle === 'yearly' ? '/year' : '/month'}
                      </span>
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
                      onClick={() => {
                        if (p.tier === 'free' && currentTier !== 'free') {
                          // Downgrade
                          upgrade(p.tier);
                        } else if (p.tier !== 'free' && p.tier !== currentTier) {
                          setSelectedPlan(p.tier);
                          setStep('payment');
                        } else {
                          onClose();
                        }
                      }}
                      disabled={busy !== null || isCurrent}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                        isCurrent ? 'bg-secondary text-muted-foreground' : p.popular ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-secondary/60 border border-border hover:border-primary/40'
                      )}
                    >
                      {busy === p.tier ? 'Processing...' : isCurrent ? 'Current plan' : p.tier === 'free' ? 'Downgrade' : `Choose ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setStep('compare')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Compare all features <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground mt-4">
              Prices shown in USD. This is a demo — no payment is processed. Upgrading updates your account tier in the database.
            </p>
          </>
        )}

        {/* Step: Compare */}
        {step === 'compare' && (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold">Free</th>
                    <th className="text-center py-3 px-4 font-semibold">Starter</th>
                    <th className="text-center py-3 px-4 font-semibold text-primary">Pro</th>
                    <th className="text-center py-3 px-4 font-semibold text-warning">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 pr-4 font-medium">{row.label}</td>
                      {(['free', 'starter', 'pro', 'elite'] as const).map((tier) => {
                        const val = row[tier];
                        return (
                          <td key={tier} className="text-center py-3 px-4">
                            {val === true ? (
                              <Check className="w-4 h-4 text-success mx-auto" />
                            ) : val === false ? (
                              <span className="text-muted-foreground/30">—</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep('plans')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to plans
              </button>
              <button
                onClick={() => setStep('plans')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
              >
                Choose a plan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Step: Payment */}
        {step === 'payment' && selectedPlan && (
          <PaymentStep
            plan={PLANS.find((p) => p.tier === selectedPlan)!}
            billingCycle={billingCycle}
            cardNumber={cardNumber}
            setCardNumber={(v) => setCardNumber(formatCardNumber(v))}
            cardName={cardName}
            setCardName={setCardName}
            cardExpiry={cardExpiry}
            setCardExpiry={(v) => setCardExpiry(formatExpiry(v))}
            cardCvc={cardCvc}
            setCardCvc={(v) => setCardCvc(v.replace(/\D/g, '').slice(0, 4))}
            onBack={() => setStep('plans')}
            onPay={() => upgrade(selectedPlan)}
            busy={busy !== null}
          />
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Processing your payment securely...</p>
            <p className="text-xs text-muted-foreground mt-2">Do not close this window</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && selectedPlan && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="grid place-items-center w-16 h-16 rounded-full bg-success/15 mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upgrade complete!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You're now on the <span className="font-semibold text-primary">{PLANS.find((p) => p.tier === selectedPlan)?.name}</span> plan.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentStep({
  plan,
  billingCycle,
  cardNumber,
  setCardNumber,
  cardName,
  setCardName,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  onBack,
  onPay,
  busy,
}: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
  onBack: () => void;
  onPay: () => void;
  busy: boolean;
}) {
  const price = parseInt(plan.price.replace('$', ''));
  const total = billingCycle === 'yearly' ? price * 10 : price;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Order summary */}
      <div className="space-y-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Billing cycle</span>
              <span className="text-sm font-medium capitalize">{billingCycle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-sm font-medium">${price}/month</span>
            </div>
            {billingCycle === 'yearly' && (
              <div className="flex items-center justify-between text-success">
                <span className="text-sm">Yearly discount (2 months free)</span>
                <span className="text-sm font-medium">-${price * 2}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Total due today</span>
              <span className="text-lg font-bold">${total}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium mb-1">Secure payment</div>
            <p className="text-xs text-muted-foreground">Your payment is encrypted and secure. We never store your card details.</p>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="text-sm font-medium mb-2">What you get with {plan.name}:</div>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: Payment form */}
      <div className="space-y-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-success" />
            <h3 className="font-semibold">Payment Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Card number</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 border border-border focus-within:border-primary transition-colors">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  maxLength={19}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cardholder name</label>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Trader"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expiry</label>
                <input
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">CVC</label>
                <input
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-success" />
          Powered by secure encryption · 256-bit SSL
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onPay}
            disabled={busy || !cardNumber || !cardName || !cardExpiry || !cardCvc}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay ${total} & Upgrade
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          This is a demo — no real payment is processed. Card details are not stored.
        </p>
      </div>
    </div>
  );
}
