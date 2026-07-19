'use client';

import { useState } from 'react';
import {
  TrendingUp, Mail, Lock, User, ArrowRight, AlertCircle, Loader2,
  BookOpen, BarChart3, Calculator, Sparkles, CalendarDays, Newspaper,
  Target, HeartPulse, Plug, Trophy, Crosshair, ShieldCheck, Zap, Star,
  ChevronDown, Check, Quote, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

type Tab = 'signin' | 'signup' | 'about';

const TOOLS = [
  { icon: TrendingUp,   name: 'Dashboard',          desc: 'Live metrics, open positions, goals and AI insights at a glance.' },
  { icon: BookOpen,     name: 'Trading Journal',     desc: 'Document every trade with strategy tags, sessions, R:R and notes.' },
  { icon: BarChart3,    name: 'Performance Analytics', desc: 'Deep insights by instrument, session, weekday and strategy.' },
  { icon: Sparkles,     name: 'AI Trading Coach',    desc: 'Personalized coaching generated from your own trade history.' },
  { icon: Calculator,   name: 'Risk Management',     desc: '9 calculators: position size, margin, pip value, drawdown, R:R.' },
  { icon: Target,       name: 'Trading Plan',        desc: 'Daily, weekly and monthly plans with entry/exit checklists.' },
  { icon: HeartPulse,   name: 'Psychology',          desc: 'Daily mood check-ins, tilt detection and discipline scoring.' },
  { icon: CalendarDays, name: 'Economic Calendar',   desc: 'Multi-day events from ForexFactory, Investing.com and DailyFX.' },
  { icon: Newspaper,    name: 'News Center',         desc: 'AI-curated financial news with sentiment and impact ratings.' },
  { icon: Plug,         name: 'Broker Sync',         desc: 'Auto-sync trades from MT4/MT5, cTrader, Binance, IBKR and more.' },
  { icon: Crosshair,    name: 'Open Positions',      desc: 'Live floating P&L across all connected broker accounts.' },
  { icon: Trophy,       name: 'Trading Goals',       desc: 'Track progress toward profit, win-rate and discipline targets.' },
];

const FAQ = [
  {
    q: 'What is TraderOS?',
    a: 'TraderOS is the complete operating system for serious traders. Instead of juggling spreadsheets, broker terminals, news sites and journaling apps, TraderOS unifies everything — plan, execute, journal, analyze and improve — in one intelligent workspace.',
  },
  {
    q: 'Who is TraderOS built for?',
    a: 'Active retail traders, prop firm traders and small fund managers who treat trading like a business. Whether you trade forex, crypto, indices, stocks or commodities, TraderOS adapts to your workflow.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan includes up to 50 trades in your journal, the dashboard, basic risk calculators, 1 broker connection and community access — no credit card ever required. Upgrade to Starter ($19/mo), Pro ($49/mo) or Elite ($149/mo) as you grow.',
  },
  {
    q: 'Do I need to connect my broker?',
    a: 'No. Start journaling manually in seconds. When you are ready, connect a broker to enable automatic trade sync — we support MT4, MT5, cTrader, DXtrade, Interactive Brokers, OANDA, Binance and Bybit.',
  },
  {
    q: 'How does the AI Coach work?',
    a: 'The AI Coach analyzes your trade history, performance metrics and patterns to surface personalized insights — what is working, what is not, and what to fix next. Click Regenerate anytime to refresh your coaching report.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your account is protected by Supabase Auth with row-level security (RLS). Every row in the database is scoped to your account and is invisible to other users. Broker connections use read-only API keys.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Upgrade, downgrade or cancel from the Plans page at any time — no lock-in, no hidden fees.',
  },
];

const TESTIMONIALS = [
  { name: 'Marcus L.', role: 'Forex day trader',     text: 'Finally, one place for my journal, analytics and risk tools. The AI Coach caught a tilt pattern I never noticed in three years of trading.',  rating: 5 },
  { name: 'Priya S.', role: 'Prop firm trader',      text: 'The strategy × session matrix alone is worth the subscription. I cut Asia session trades and my win rate jumped 12% in a month.',              rating: 5 },
  { name: 'David K.', role: 'Crypto swing trader',   text: 'Auto-sync from Binance saves me 30 minutes a day. The dashboard is the first thing I open every morning before the market.',                 rating: 5 },
];

const STATS = [
  { value: '2,400+', label: 'Active traders' },
  { value: '12',     label: 'Modules' },
  { value: '9',      label: 'Calculators' },
  { value: '10+',    label: 'Brokers' },
];

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab]               = useState<Tab>('signin');
  const [mode, setMode]             = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [busy, setBusy]             = useState(false);
  const [openFaq, setOpenFaq]       = useState<number | null>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setSuccess('Account created! Signing you in…');
    }
  };

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setTab(m);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen">
      {/* Sticky nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-semibold tracking-tight">TraderOS</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Operating System</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NavBtn active={tab === 'about'} onClick={() => setTab('about')}>About &amp; Tools</NavBtn>
            <NavBtn active={tab === 'signin'} onClick={() => switchMode('signin')}>Sign in</NavBtn>
            <button
              onClick={() => switchMode('signup')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Auth views ─────────────────────────────────────────────── */}
      {tab !== 'about' && (
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
          {/* Glow blobs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-success/10 blur-3xl pointer-events-none" />

          {/* Left: marketing panel */}
          <div className="relative hidden lg:flex flex-col justify-center px-12 py-16 gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-5">
                <Zap className="w-3 h-3" /> The complete trading operating system
              </div>
              <h1 className="text-4xl font-semibold tracking-tight leading-[1.1] mb-4">
                Plan, execute, journal,<br />
                analyze, and improve —<br />
                <span className="gradient-text">all in one place.</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                TraderOS brings your journal, analytics, AI coaching, risk tools, broker sync and economic calendar into one unified workspace. Stop juggling — start winning.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 max-w-sm">
              {STATS.map((s) => (
                <div key={s.label} className="glass rounded-lg p-3 text-center">
                  <div className="text-xl font-semibold gradient-text">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2">
              {['Journal', 'Analytics', 'AI Coach', 'Risk Tools', 'Broker Sync', 'Econ Calendar'].map((f) => (
                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/60 border border-border text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-success" /> {f}
                </span>
              ))}
            </div>

            {/* Mini testimonial */}
            <div className="glass rounded-xl p-4 max-w-sm">
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />)}
              </div>
              <p className="text-sm italic text-muted-foreground mb-3">"The strategy × session matrix alone is worth it. My win rate jumped 12% in a month."</p>
              <div className="flex items-center gap-2">
                <div className="grid place-items-center w-7 h-7 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-xs font-semibold">PS</div>
                <div className="text-xs"><span className="font-medium">Priya S.</span> <span className="text-muted-foreground">— Prop firm trader</span></div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" /> Bank-grade security · No credit card needed · Cancel anytime
            </p>
          </div>

          {/* Right: auth card */}
          <div className="relative flex items-center justify-center px-6 py-12 sm:px-12">
            <div className="w-full max-w-md glass-strong rounded-2xl p-7 sm:p-9 animate-slide-up">
              {/* Mobile brand */}
              <div className="lg:hidden flex items-center gap-2.5 mb-6">
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-semibold tracking-tight">TraderOS</span>
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-1 mb-6">
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
                      mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-semibold">
                  {mode === 'signin' ? 'Welcome back, trader' : 'Start in 10 seconds'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'signin'
                    ? 'Sign in to access your trading workspace.'
                    : 'Free forever. No credit card required.'}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-3">
                {mode === 'signup' && (
                  <AuthField icon={User} label="Your name">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jordan Trade"
                      className="auth-input"
                      required
                    />
                  </AuthField>
                )}

                <AuthField icon={Mail} label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="auth-input"
                    required
                  />
                </AuthField>

                <AuthField
                  icon={Lock}
                  label="Password"
                  hint={mode === 'signup' ? 'Min 8 chars · mix letters, numbers & symbols e.g. Trading@2026' : undefined}
                >
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </AuthField>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-xs text-success animate-fade-in">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {busy
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{mode === 'signin' ? 'Sign in to TraderOS' : 'Create my free account'} <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-5">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === 'signin' ? 'Create one free' : 'Sign in'}
                </button>
              </p>

              <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border">
                {[['ShieldCheck', 'Secure & private'], ['Check', 'Free forever'], ['Check', 'Cancel anytime']].map(([, l]) => (
                  <span key={l} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Check className="w-3 h-3 text-success" /> {l}
                  </span>
                ))}
              </div>

              {/* About link */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setTab('about')}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  Learn more about TraderOS →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── About / Tools / FAQ ───────────────────────────────────── */}
      {tab === 'about' && (
        <div className="animate-fade-in">
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-success/10 blur-3xl pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-5">
                <Sparkles className="w-3 h-3" /> About TraderOS
              </div>
              <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl mx-auto">
                The operating system<br /><span className="gradient-text">for serious traders.</span>
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-6">
                TraderOS unifies every part of your trading workflow — plan, execute, journal, analyze and improve — all in one intelligent workspace. Built for traders who treat their craft like a business.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                {STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{s.value}</span> {s.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <button onClick={() => switchMode('signup')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                  Get started free <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => switchMode('signin')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary/60 border border-border text-sm font-medium hover:border-primary/40">
                  Sign in
                </button>
              </div>
            </div>
          </section>

          {/* Tools grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">Every tool a trader needs</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">12 integrated modules built for traders who run their operation like a business.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.name} className="glass rounded-xl p-5 hover:border-primary/40 transition-colors group cursor-default">
                    <div className="grid place-items-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Testimonials */}
          <section className="border-y border-border bg-secondary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-semibold tracking-tight">Traders love TraderOS</h2>
                <p className="text-sm text-muted-foreground mt-2">Join 2,400+ traders who run their craft on TraderOS.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="glass rounded-xl p-6">
                    <Quote className="w-6 h-6 text-primary/30 mb-3" />
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />)}
                    </div>
                    <p className="text-sm leading-relaxed mb-5 text-muted-foreground">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-sm font-semibold shrink-0">
                        {t.name.split(' ').map((w) => w[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
              <p className="text-sm text-muted-foreground mt-2">Everything you need to know before you sign up.</p>
            </div>
            <div className="space-y-2">
              {FAQ.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="glass rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-secondary/20 transition-colors"
                    >
                      <span className="text-sm font-medium">{item.q}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in border-t border-border/40 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA block */}
            <div className="text-center mt-12 glass-strong rounded-2xl p-10">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-success text-primary-foreground mx-auto mb-4">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Ready to trade like a business?</h3>
              <p className="text-sm text-muted-foreground mb-6">Free forever. No credit card. Cancel anytime.</p>
              <button
                onClick={() => switchMode('signup')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create your free account <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" /> Secure · Private · Takes 10 seconds
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">TraderOS</span>
              </div>
              <p className="text-xs text-muted-foreground">© 2026 TraderOS — The operating system for traders.</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
      )}
    >
      {children}
    </button>
  );
}

function AuthField({
  icon: Icon, label, hint, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 border border-border focus-within:border-primary transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        {children}
      </div>
      {hint && <span className="block text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{hint}</span>}
    </label>
  );
}
