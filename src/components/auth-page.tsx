'use client';
import { useState } from 'react';
import { TrendingUp, Mail, Lock, User, ArrowRight, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validatePassword } from '@/lib/validation';

const FEATURES = [
  { icon: TrendingUp, title: 'Trading Journal', desc: 'Document every trade with full metadata' },
  { icon: Check, title: 'Performance Analytics', desc: '200+ metrics at your fingertips' },
  { icon: TrendingUp, title: 'AI Trading Coach', desc: 'Personalized insights from your data' },
  { icon: Check, title: 'Risk Management', desc: 'Professional calculators for every position' },
];

type Mode = 'signin' | 'signup' | 'forgot';

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) { setError(pwCheck.message!); return; }
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary/40">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.15), transparent 50%), radial-gradient(circle at 70% 80%, hsl(var(--chart-4) / 0.1), transparent 40%)' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <BrandLogo size="lg" />
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">The Operating System for Traders</h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">Plan, execute, journal, analyze, and improve — all in one intelligent ecosystem.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {FEATURES.map((f) => { const Icon = f.icon; return (<div key={f.title} className="glass rounded-xl p-4"><Icon className="w-5 h-5 text-primary mb-2" /><h3 className="text-sm font-semibold mb-0.5">{f.title}</h3><p className="text-xs text-muted-foreground">{f.desc}</p></div>); })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 TraderOS — The operating system for traders.</p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center"><BrandLogo size="lg" /></div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-1">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? 'Sign in to your TraderOS workspace' : mode === 'signup' ? 'Start your trading journey today' : 'Enter your email and we\'ll send you a reset link'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Trader" className="pl-10" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@example.com" className="pl-10" required />
              </div>
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && password.length > 0 && (
                  <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters, numbers, and symbols.</p>
                )}
              </div>
            )}
            {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
            {success && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">{success}</div>}
            <Button type="submit" disabled={loading} className="w-full group">
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : (
                <>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>
          {mode === 'signin' && (
            <div className="mt-4 text-center">
              <button onClick={() => switchMode('forgot')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Forgot your password?
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <div className="mt-6 text-center">
              <button onClick={() => switchMode('signin')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            </div>
          )}
          {mode !== 'forgot' && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-primary font-medium hover:underline">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
