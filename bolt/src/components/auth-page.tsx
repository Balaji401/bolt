'use client';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { TrendingUp, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, BarChart3, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword } from '@/lib/validation';

const FEATURES = [
  { icon: TrendingUp, title: 'Trading Journal', desc: 'Document every trade with full metadata' },
  { icon: BarChart3, title: 'Performance Analytics', desc: '200+ metrics at your fingertips' },
  { icon: Sparkles, title: 'AI Trading Coach', desc: 'Personalized insights from your data' },
  { icon: ShieldCheck, title: 'Risk Management', desc: 'Professional calculators for every position' },
];

const heroChartData = [
  { time: '08:00', value: 2300 },
  { time: '09:00', value: 2318 },
  { time: '10:00', value: 2311 },
  { time: '11:00', value: 2334 },
  { time: '12:00', value: 2348 },
  { time: '13:00', value: 2339 },
  { time: '14:00', value: 2364 },
  { time: '15:00', value: 2352 },
  { time: '16:00', value: 2349 },
  { time: '17:00', value: 2361 },
  { time: '18:00', value: 2354 },
  { time: '19:00', value: 2367 },
];

const MARKET_TICKERS = ['EUR/USD +0.42%', 'GBP/USD +0.18%', 'XAU/USD +1.12%', 'NAS100 +0.74%', 'BTC/USD +2.06%'];
const FLOATING_MARKET_TAGS = [
  { label: 'EURUSD', value: '1.1742', color: 'text-cyan-300/80' },
  { label: 'XAUUSD', value: '2354.20', color: 'text-emerald-300/80' },
  { label: 'NAS100', value: '21984', color: 'text-violet-300/80' },
  { label: 'GBPUSD', value: '1.2688', color: 'text-sky-300/80' },
];

const equityData = [
  { day: 'M', value: 4200 },
  { day: 'T', value: 4310 },
  { day: 'W', value: 4465 },
  { day: 'T', value: 4520 },
  { day: 'F', value: 4688 },
  { day: 'S', value: 4754 },
  { day: 'S', value: 4812 },
  { day: 'M', value: 4940 },
  { day: 'T', value: 5082 },
  { day: 'W', value: 5214 },
  { day: 'T', value: 5384 },
  { day: 'F', value: 5512 },
];

const behaviorData = [
  { label: 'Risk Drift', value: 72 },
  { label: 'Freq', value: 58 },
  { label: 'Checklist', value: 44 },
  { label: 'Journal', value: 63 },
  { label: 'Focus', value: 79 },
];

type Mode = 'home' | 'signin' | 'signup' | 'forgot';

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handleGoogle = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        setError(pwCheck.message!);
        return;
      }
    }

    setLoading(true);
    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else if (mode === 'signup') {
      const result = await signUp(email, password, name);
      if (result.error) setError(result.error);
      else setSuccess('Account created! Check your inbox to confirm your email, then sign in.');
    } else {
      const result = await resetPassword(email);
      if (result.error) setError(result.error);
      else setSuccess('Password reset link sent! Check your inbox for instructions.');
    }
    setLoading(false);
  };

  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-[#060d18] text-white">
        <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
          <div className="trading-hero-shell overflow-hidden rounded-[28px] border border-white/10 bg-[#07111c]/95 shadow-[0_30px_90px_rgba(4,9,17,0.7)]">
            <div className="trading-hero-backdrop" aria-hidden="true">
              <div className="hero-grid" />
              <div className="hero-price-line hero-price-line-one" />
              <div className="hero-price-line hero-price-line-two" />
              <div className="hero-candles">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} className={`candle candle-${index % 5}`} style={{ left: `${(index * 7.5) % 100}%`, animationDelay: `${index * 0.6}s` }} />
                ))}
              </div>
              <div className="floating-market-tags">
                {FLOATING_MARKET_TAGS.map((tag) => (
                  <div key={tag.label} className="floating-market-tag">
                    <span className={tag.color}>{tag.label}</span>
                    <span className="text-slate-300/80">{tag.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-sm">
              <div className="market-ticker-wrap">
                <div className="market-ticker-track">
                  {[...MARKET_TICKERS, ...MARKET_TICKERS].map((ticker, index) => (
                    <div key={`${ticker}-${index}`} className="market-ticker-item">
                      <span className="ticker-symbol">{ticker.split(' ')[0]}</span>
                      <span className="ticker-value">{ticker.split(' ').slice(1).join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <header className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <BrandLogo size="md" />
                <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-300 md:flex">
                  Trading intelligence platform
                </div>
              </div>

              <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
                <a href="#platform" className="transition hover:text-white">Platform</a>
                <a href="#journal" className="transition hover:text-white">Journal</a>
                <a href="#analytics" className="transition hover:text-white">Analytics</a>
                <a href="#risk" className="transition hover:text-white">Risk</a>
                <a href="#ai" className="transition hover:text-white">AI Coach</a>
              </nav>

              <div className="flex items-center gap-2">
                <Button onClick={() => switchMode('signin')} variant="ghost" className="hidden sm:inline-flex text-white hover:bg-white/5">Sign in</Button>
                <Button onClick={() => switchMode('signup')} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">Start free</Button>
              </div>
            </header>

            <main className="relative z-10 space-y-8 px-5 pb-10 pt-7 lg:px-8 lg:pb-16 lg:pt-10">
              <section className="reveal-card grid items-start gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    TraderOS
                  </div>

                  <div className="space-y-4">
                    <h1 className="max-w-[640px] text-4xl font-black leading-[0.95] tracking-[-0.08em] text-white lg:text-6xl">
                      Your Trading.
                      <span className="mt-1 block max-w-[560px] text-cyan-300">One Intelligent System.</span>
                    </h1>
                    <p className="max-w-[620px] text-lg leading-8 text-slate-300">
                      Journal every trade, understand your decisions, analyze your performance, and build a repeatable process with AI-powered trading intelligence.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
                    <Button onClick={() => switchMode('signup')} className="h-12 rounded-xl bg-cyan-500 px-6 text-base font-semibold text-slate-950 hover:bg-cyan-400">
                      Start for free
                    </Button>
                    <Button onClick={() => switchMode('signin')} variant="outline" className="h-12 rounded-xl border-slate-700 bg-slate-900/80 px-6 text-base text-white hover:bg-slate-800">
                      Explore platform
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Trades logged', value: '12.4K' },
                      { label: 'Avg. R', value: '+1.82' },
                      { label: 'Risk coverage', value: '94%' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-cyan-500/15 bg-[#081522] p-3 shadow-[0_20px_50px_rgba(6,17,28,0.9)]">
                  <div className="rounded-[20px] border border-white/10 bg-[#0a1522] p-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">XAUUSD</div>
                        <div className="mt-1 text-2xl font-bold text-white">$2,354.20</div>
                      </div>
                      <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        +1.12%
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_0.7fr]">
                      <div className="h-56 rounded-2xl border border-white/10 bg-[#07141d] p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={heroChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.08} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="2 6" vertical={false} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.2} fill="url(#heroFill)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3">
                        {[
                          ['Entry', '2,332.10'],
                          ['SL', '2,305.60'],
                          ['TP', '2,410.40'],
                          ['Risk', '0.75%'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
                            <div className="mt-2 text-lg font-semibold text-white">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="platform" className="reveal-card space-y-5 pt-2">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">TraderOS workspace</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">Everything a serious trading workflow needs.</h2>
                  </div>
                  <p className="hidden max-w-md text-sm leading-7 text-slate-300 lg:block">
                    Built to connect journal, analytics, psychology, market context, and AI intelligence in one disciplined operating system.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-left">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{feature.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section id="journal" className="reveal-card grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 text-left">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Trading journal</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">Execution Review</h3>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300">+1.8R avg</div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <table className="min-w-full text-left text-sm text-slate-200">
                      <thead className="bg-slate-950/80 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Symbol</th>
                          <th className="px-4 py-3">Direction</th>
                          <th className="px-4 py-3">Risk</th>
                          <th className="px-4 py-3">R</th>
                          <th className="px-4 py-3">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['2026-09-25', 'XAUUSD', 'Long', '0.75%', '+1.8R', '+$420'],
                          ['2026-09-24', 'EURUSD', 'Short', '0.60%', '-1.1R', '-$180'],
                          ['2026-09-23', 'NAS100', 'Long', '0.80%', '+2.4R', '+$640'],
                          ['2026-09-22', 'GBPUSD', 'Short', '0.65%', '+0.9R', '+$210'],
                        ].map(([date, symbol, direction, risk, rr, pnl]) => (
                          <tr key={`${date}-${symbol}`} className="border-t border-white/10 bg-slate-900/40">
                            <td className="px-4 py-3 text-slate-300">{date}</td>
                            <td className="px-4 py-3 font-medium text-white">{symbol}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${direction === 'Long' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                                {direction}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{risk}</td>
                            <td className={`px-4 py-3 font-semibold ${rr.startsWith('-') ? 'text-rose-300' : 'text-emerald-300'}`}>{rr}</td>
                            <td className={`px-4 py-3 font-semibold ${pnl.startsWith('-') ? 'text-rose-300' : 'text-emerald-300'}`}>{pnl}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="analytics" className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Performance analytics</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Equity curve</h3>
                  <div className="mt-4 h-52 rounded-2xl border border-white/10 bg-[#07141d] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="2 6" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.2} fill="url(#equityFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ['Win rate', '68.4%'],
                      ['Profit factor', '2.14'],
                      ['Avg R', '+1.82'],
                      ['Expectancy', '+$89'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                        <div className="mt-2 text-xl font-semibold text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="risk" className="reveal-card grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Risk intelligence</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Current risk profile</h3>

                  <div className="mt-5 space-y-4">
                    {[
                      ['Daily risk', '0.75%', 42],
                      ['Risk utilization', '42%', 42],
                      ['Current drawdown', '2.8%', 28],
                      ['Max drawdown', '5.1%', 51],
                    ].map(([label, value, percent]) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{label}</span>
                          <span className="font-semibold text-white">{value}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Behavioral intelligence</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Behavior trend</h3>
                  <div className="mt-4 h-52 rounded-2xl border border-white/10 bg-[#07141d] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={behaviorData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="2 6" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Trading psychology</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Discipline and execution quality</h3>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ['Discipline', '78%'],
                      ['Confidence', '72%'],
                      ['Patience', '81%'],
                      ['Stress', '34%'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                        <div className="mt-3 text-3xl font-bold text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="ai" className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">TraderOS AI Coach</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Your objective trading review</h3>
                  <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Trader</div>
                    <p className="mt-2 text-base text-slate-200">“Why have my results declined this week?”</p>
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-300">AI coach</div>
                    <p className="mt-2 text-base leading-7 text-slate-200">
                      “Your recent risk increased while checklist adherence dropped. Across your last 20 trades, average risk increased from 0.8% to 1.2%.”
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    {[
                      ['20 trades', 'Evidence'],
                      ['+50%', 'Risk'],
                      ['-18%', 'Checklist'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                        <div className="text-lg font-semibold text-white">{value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Strategy intelligence</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">NY Open Reversal</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      ['42 trades', 'Volume'],
                      ['68% win rate', 'Efficiency'],
                      ['+0.82R avg', 'Edge'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                        <div className="text-lg font-semibold text-white">{value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 h-32 rounded-2xl border border-white/10 bg-[#07141d] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData.slice(0, 12)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.2} fill="rgba(245, 158, 11, 0.18)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Market context</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Economic calendar</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ['09:30', 'USD', 'CPI', 'High impact'],
                      ['14:00', 'EUR', 'ECB Rate Decision', 'High impact'],
                      ['16:00', 'USD', 'FOMC Minutes', 'Medium impact'],
                    ].map(([time, region, label, impact]) => (
                      <div key={`${time}-${label}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                        <div className="rounded-xl bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{region} · {label}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{impact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Knowledge graph</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">The TraderOS operating model</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-7">
                  {['Strategy', 'Setup', 'Trade', 'Review', 'Mistake', 'Lesson', 'Improvement'].map((node, index) => (
                    <div key={node} className="flex flex-col items-center gap-2">
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-center text-sm font-medium text-cyan-200">
                        {node}
                      </div>
                      {index < 6 && <div className="h-6 w-px bg-white/20" />}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[24px] border border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 via-slate-900/80 to-emerald-500/5 p-6 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-300/80">Ready to trade smarter?</p>
                <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Understand your trades. Understand your behavior. Understand your edge.</h3>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={() => switchMode('signup')} className="h-12 rounded-xl bg-cyan-500 px-6 text-base font-semibold text-slate-950 hover:bg-cyan-400">
                    Create account
                  </Button>
                  <Button onClick={() => switchMode('signin')} variant="outline" className="h-12 rounded-xl border-slate-700 bg-slate-900/80 px-6 text-base text-white hover:bg-slate-800">
                    Sign in
                  </Button>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <div className="relative flex flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),transparent_20%),linear-gradient(135deg,#07111d,#0b1626_50%,#09151f)]">
          <div className="relative z-10 flex w-full flex-col justify-between p-6 lg:p-10">
            <div className="flex items-center justify-between">
              <BrandLogo size="lg" />
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live trader workflow
              </div>
            </div>
            <div className="flex-1" />
          </div>
        </div>

        <div className="flex w-full max-w-xl items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="space-y-5">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300/80">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Recover access'}
              </p>
              <h2 className="text-5xl font-black tracking-[-0.07em] text-white">
                {mode === 'signin' ? 'Sign in to TraderOS' : mode === 'signup' ? 'Create your TraderOS account' : 'Reset your password'}
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <button onClick={handleGoogle} disabled={googleLoading} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 text-lg font-medium text-white transition hover:bg-slate-800">
                {googleLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Globe className="h-5 w-5" />}
                {googleLoading ? 'Connecting…' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                OR
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium text-slate-200">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Trader" className="h-12 rounded-xl border-slate-700 bg-slate-900/80 pl-10 text-white placeholder:text-slate-500" required />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium text-slate-200">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@example.com" className="h-12 rounded-xl border-slate-700 bg-slate-900/80 pl-10 text-white placeholder:text-slate-500" required />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-medium text-slate-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl border-slate-700 bg-slate-900/80 pl-10 pr-10 text-white placeholder:text-slate-500" required minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
                {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</div>}

                <Button type="submit" disabled={loading} className="h-14 w-full rounded-xl bg-cyan-500 text-xl font-semibold text-slate-950 hover:bg-cyan-400">
                  {loading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Please wait</span> : (
                    <span className="flex items-center justify-center gap-2">
                      {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="flex flex-col items-center gap-3 text-base text-slate-300">
                {mode === 'signin' && (
                  <button onClick={() => switchMode('forgot')} className="text-cyan-300 hover:text-cyan-200">Forgot your password?</button>
                )}

                {mode === 'forgot' && (
                  <button onClick={() => switchMode('signin')} className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </button>
                )}

                {mode !== 'forgot' && (
                  <p>
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                    <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="ml-2 font-medium text-cyan-300 hover:text-cyan-200">
                      {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                )}

                <button onClick={() => switchMode('home')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
