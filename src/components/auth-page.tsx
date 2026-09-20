'use client';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword } from '@/lib/validation';

const FEATURES = [
  { icon: BarChart3, title: 'Performance Analytics', desc: 'Turn your trading history into clear, actionable metrics.' },
  { icon: BrainCircuit, title: 'AI Trading Coach', desc: 'Spot patterns, habits, and decision-making signals.' },
  { icon: ShieldCheck, title: 'Risk Management', desc: 'Keep risk, exposure, and execution in one place.' },
];

const HIGHLIGHTS = ['Journal every trade', 'Track your psychology', 'Review what actually works'];

type Mode = 'signin' | 'signup' | 'forgot';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.41-.18-2.08H12v3.94h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.22Z" />
      <path fill="#34A853" d="M12 21.72c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.74 9.74 0 0 0 12 21.72Z" />
      <path fill="#FBBC05" d="M6.54 13.82A5.85 5.85 0 0 1 6.23 12c0-.63.11-1.25.31-1.82V7.67H3.3A9.73 9.73 0 0 0 2.28 12c0 1.57.38 3.05 1.02 4.33l3.24-2.51Z" />
      <path fill="#EA4335" d="M12 6.15c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.16 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.7 5.39l3.24 2.51C7.31 7.87 9.46 6.15 12 6.15Z" />
    </svg>
  );
}

export function AuthPage() {
  const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
  };

  const handleGoogle = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
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

  const submitLabel = mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link';

  return (
    <div className="min-h-screen overflow-hidden bg-[#090b10] text-foreground">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        {/* Ambient background */}
        <div className="pointer-events-none absolute -left-40 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-12rem] bottom-[-16rem] h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

        {/* Product side */}
        <section className="relative hidden min-h-screen border-r border-white/[0.07] lg:flex">
          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-9 xl:px-16 xl:py-12">
            <BrandLogo size="lg" />

            <div className="max-w-2xl py-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Built for serious trading review
              </div>

              <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] xl:text-6xl">
                Trade with a plan.
                <span className="block bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  Learn from every trade.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                TraderOS brings your journal, analytics, psychology, risk management, and AI insights into one focused trading workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
                {HIGHLIGHTS.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/[0.055]">
                      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                <div className="flex -space-x-2">
                  {['B', 'T', 'R'].map((letter) => (
                    <div key={letter} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0b0e13] bg-slate-700 text-[11px] font-semibold text-white">
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-200">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    One workspace for your trading process
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">Capture decisions, not just P&amp;L.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600">© 2026 TraderOS — The operating system for traders.</p>
          </div>
        </section>

        {/* Auth side */}
        <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo size="lg" />
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8">
              <div className="mb-7">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Start your trading OS' : 'Reset your password'}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">
                  {mode === 'signin'
                    ? 'Sign in to continue to your TraderOS workspace.'
                    : mode === 'signup'
                      ? 'Create your workspace and start building a better trading process.'
                      : 'Enter your email and we’ll send you a reset link.'}
                </p>
              </div>

              {mode !== 'forgot' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading}
                    onClick={handleGoogle}
                    className="h-11 w-full border-white/[0.12] bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  >
                    {googleLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <>
                        <GoogleMark />
                        <span className="ml-2">Continue with Google</span>
                      </>
                    )}
                  </Button>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.08]" />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-600">or continue with email</span>
                    <div className="h-px flex-1 bg-white/[0.08]" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Trader" className="h-11 border-white/[0.1] bg-black/20 pl-10 text-white placeholder:text-slate-600" required />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@example.com" className="h-11 border-white/[0.1] bg-black/20 pl-10 text-white placeholder:text-slate-600" required />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 border-white/[0.1] bg-black/20 pl-10 pr-10 text-white placeholder:text-slate-600" required minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === 'signup' && password.length > 0 && (
                      <p className="text-xs text-slate-500">Use 8+ characters with letters, numbers, and symbols.</p>
                    )}
                  </div>
                )}

                {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300">{error}</div>}
                {success && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-300">{success}</div>}

                <Button type="submit" disabled={loading} className="h-11 w-full bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 group">
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-950" />
                  ) : (
                    <>
                      {submitLabel}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>

              {mode === 'signin' && (
                <div className="mt-4 text-center">
                  <button onClick={() => switchMode('forgot')} className="text-sm text-slate-500 transition-colors hover:text-cyan-300">
                    Forgot your password?
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="mt-6 text-center">
                  <button onClick={() => switchMode('signin')} className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </button>
                </div>
              )}

              {mode !== 'forgot' && (
                <div className="mt-7 text-center text-sm text-slate-500">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline">
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> Secure authentication</span>
              <span className="h-3 w-px bg-white/[0.08]" />
              <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3" /> Your data stays yours</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
