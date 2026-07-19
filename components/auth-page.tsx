'use client';

import { useState } from 'react';
import {
  TrendingUp, Mail, Lock, User, ArrowRight, AlertCircle, Loader2,
  BookOpen, BarChart3, Calculator, Sparkles, CalendarDays, Newspaper,
  Target, HeartPulse, Plug, Trophy, Crosshair, ShieldCheck, Zap, Star,
  ChevronDown, Check, Quote,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

type Tab = 'signin' | 'signup' | 'about';

const TOOLS = [
  { icon: TrendingUp, name: 'Dashboard', desc: 'Your trading command center with live metrics, open positions, and goals.' },
  { icon: BookOpen, name: 'Trading Journal', desc: 'Every trade documented with strategy tags, sessions, R:R, confidence, and notes.' },
  { icon: BarChart3, name: 'Performance Analytics', desc: 'Deep insights by instrument, session, weekday, and strategy — find your edge.' },
  { icon: Sparkles, name: 'AI Trading Coach', desc: 'Personalized insights generated from your trade history. Regenerate anytime.' },
  { icon: Calculator, name: 'Risk Management', desc: '9 professional calculators: position size, margin, pip value, drawdown, compound, R:R.' },
  { icon: Target, name: 'Trading Plan', desc: 'Daily, weekly, and monthly plans with entry/exit checklists and rules.' },
  { icon: HeartPulse, name: 'Psychology', desc: 'Daily mood check-ins, tilt tracking, and discipline scoring.' },
  { icon: CalendarDays, name: 'Economic Calendar', desc: 'Multi-day events from ForexFactory, Investing.com, DailyFX. Filter by your trades.' },
  { icon: Newspaper, name: 'News Center', desc: 'AI-curated financial news with sentiment analysis and impact ratings.' },
  { icon: Plug, name: 'Broker Sync', desc: 'Auto-sync trades from MT4/MT5, cTrader, DXtrade, Binance, IBKR, and more.' },
  { icon: Crosshair, name: 'Open Positions', desc: 'Live floating P&L from all connected brokers in one view.' },
  { icon: Trophy, name: 'Trading Goals', desc: 'Track progress toward profit, win-rate, and discipline targets.' },
];

const FAQ = [
  {
    q: 'What is TraderOS?',
    a: 'TraderOS is a complete operating system for traders. Instead of juggling spreadsheets, broker terminals, news sites, and journaling apps, TraderOS brings everything into one intelligent workspace — plan, execute, journal, analyze, and improve.',
  },
  {
    q: 'Who is it for?',
    a: 'TraderOS is built for active retail traders, prop firm traders, and small fund managers who treat trading like a business. Whether you trade forex, crypto, indices, stocks, or commodities, TraderOS adapts to your workflow.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan includes up to 50 trades in your journal, the dashboard, basic risk calculators, 1 broker connection, and community access — no credit card required. Upgrade to Starter ($19/mo), Pro ($49/mo), or Elite ($149/mo) as you grow.',
  },
  {
    q: 'Do I need to connect my broker?',
    a: 'No. You can start journaling trades manually in seconds. When you are ready, connect a broker to enable automatic trade sync — we support MT4, MT5, cTrader, DXtrade, MatchTrader, Interactive Brokers, OANDA, Binance, and Bybit.',
  },
  {
    q: 'How does the AI Coach work?',
    a: 'The AI Coach analyzes your trade history, performance metrics, and patterns to generate personalized insights — what is working, what is not, and what to fix. Click Regenerate anytime to refresh your coaching insights.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your account is protected by Supabase Auth with row-level security. Your trades, journal entries, and personal data are scoped to your account and never shared with other users. Broker connections use read-only API access.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Upgrade, downgrade, or cancel from the Plans page at any time. No lock-in, no hidden fees.',
  },
];

const TESTIMONIALS = [
  { name: 'Marcus L.', role: 'Forex day trader', text: 'Finally, one place for my journal, analytics, and risk tools. The AI Coach caught a tilt pattern I never noticed.', rating: 5 },
  { name: 'Priya S.', role: 'Prop firm trader', text: 'The strategy × session matrix alone is worth it. I cut my Asia session trades and my win rate jumped 12%.', rating: 5 },
  { name: 'David K.', role: 'Crypto swing trader', text: 'Auto-sync from Binance saves me 30 minutes a day. The dashboard is the first thing I open in the morning.', rating: 5 },
];

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<Tab>('signin');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    setBusy(false);
    if (result.error) setError(result.error);
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.error) setError(result.error);
  };

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setTab(m);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight">TraderOS</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Operating System</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('about')} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'about' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60')}>
              About & Tools
            </button>
            <button onClick={() => switchMode('signin')} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'signin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60')}>
              Sign in
            </button>
            <button onClick={() => switchMode('signup')} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60')}>
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero + auth */}
      {tab !== 'about' && (
        <section className="relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-success/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: marketing */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
                <Zap className="w-3 h-3" />
                The complete trading operating system
              </div>
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
                Plan, execute, journal,<br />
                analyze, and improve —<br />
                <span className="gradient-text">all in one place.</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                TraderOS is the operating system for serious traders. Stop juggling spreadsheets, broker terminals, and news sites. Everything you need to trade like a business — in one intelligent ecosystem.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {[Star, Star, Star].map((_, i) => <Star key={i} className="w-4 h-4 text-warning fill-warning" />)}
                  </div>
                  <span className="text-muted-foreground">4.9/5 from 2,400+ traders</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  Bank-grade security
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
                {[
                  ['12', 'Modules'],
                  ['9', 'Calculators'],
                  ['10+', 'Brokers'],
                ].map(([n, l]) => (
                  <div key={l} className="glass rounded-lg p-3 text-center">
                    <div className="text-2xl font-semibold gradient-text">{n}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: auth card */}
            <div className="glass-strong rounded-2xl p-6 sm:p-8 animate-slide-up">
              <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-1 mb-6">
                <button onClick={() => switchMode('signin')} className={cn('flex-1 py-1.5 rounded-md text-sm font-medium transition-colors', mode === 'signin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  Sign in
                </button>
                <button onClick={() => switchMode('signup')} className={cn('flex-1 py-1.5 rounded-md text-sm font-medium transition-colors', mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  Create account
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-1">
                {mode === 'signin' ? 'Welcome back, trader' : 'Start in 10 seconds'}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {mode === 'signin' ? 'Sign in to access your trading workspace' : 'Free forever. No credit card required.'}
              </p>

              <button
                onClick={google}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/60 border border-border text-sm font-medium hover:border-primary/40 disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-3">
                {mode === 'signup' && (
                  <InputField icon={User} label="Display name">
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jordan Trade" className="auth-input" required />
                  </InputField>
                )}
                <InputField icon={Mail} label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="auth-input" required />
                </InputField>
                <InputField icon={Lock} label="Password" hint={mode === 'signup' ? 'At least 8 characters, mix letters, numbers, and symbols.' : undefined}>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="auth-input" minLength={8} required />
                </InputField>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === 'signin' ? 'Sign in' : 'Create free account'} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-5">
                {mode === 'signin' ? "New to TraderOS? " : 'Already have an account? '}
                <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-primary font-medium hover:underline">
                  {mode === 'signin' ? 'Create a free account' : 'Sign in'}
                </button>
              </p>

              <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-success" /> Secure</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> No credit card</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About + Tools + FAQ */}
      {tab === 'about' && (
        <div className="animate-fade-in">
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-success/10 blur-3xl pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-5">
                <Sparkles className="w-3 h-3" /> About TraderOS
              </div>
              <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl mx-auto">
                The operating system <span className="gradient-text">for serious traders.</span>
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-6">
                TraderOS brings every part of your trading workflow into one intelligent workspace. Plan your trades, journal every position, analyze your edge, sync your brokers, and get personalized AI coaching — all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <button onClick={() => switchMode('signup')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
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
              <p className="text-sm text-muted-foreground mt-2">12 integrated modules, built for traders who treat their craft like a business.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.name} className="glass rounded-xl p-5 hover:border-primary/40 transition-colors group">
                    <div className="grid place-items-center w-10 h-10 rounded-lg bg-primary/15 text-primary mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{t.name}</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="glass rounded-xl p-5">
                    <Quote className="w-6 h-6 text-primary/40 mb-3" />
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />)}
                    </div>
                    <p className="text-sm leading-relaxed mb-4">{t.text}</p>
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-sm font-semibold">
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
                    <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 p-4 text-left">
                      <span className="text-sm font-medium">{item.q}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-10 glass-strong rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2">Ready to trade like a business?</h3>
              <p className="text-sm text-muted-foreground mb-5">Free forever. No credit card. Cancel anytime.</p>
              <button onClick={() => switchMode('signup')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Create your free account <ArrowRight className="w-4 h-4" />
              </button>
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
              <p className="text-xs text-muted-foreground">© 2026 TraderOS. The operating system for traders.</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

function InputField({ icon: Icon, label, children, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 border border-border focus-within:border-primary transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {children}
      </div>
      {hint && <span className="block text-[10px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
