'use client';
import { User, TrendingUp, AlertTriangle, Target, Brain, Award, Clock, Activity } from 'lucide-react';
import type { TraderProfileData } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function TraderProfile({ profile }: { profile: TraderProfileData }) {
  const sections = [
    { label: 'Trading Style', value: profile.trading_style, icon: Brain },
    { label: 'Preferred Markets', values: profile.preferred_markets, icon: Activity },
    { label: 'Preferred Instruments', values: profile.preferred_instruments, icon: Target },
    { label: 'Preferred Sessions', values: profile.preferred_sessions, icon: Clock },
    { label: 'Preferred Timeframes', values: profile.preferred_timeframes, icon: Activity },
    { label: 'Typical Risk', value: profile.typical_risk_pct > 0 ? `${profile.typical_risk_pct.toFixed(2)}% per trade` : 'Not set', icon: AlertTriangle },
    { label: 'Typical Holding Time', value: profile.typical_holding_minutes != null ? `${profile.typical_holding_minutes < 60 ? `${profile.typical_holding_minutes} min` : `${(profile.typical_holding_minutes / 60).toFixed(1)} hr`}` : 'Not set', icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          Your trader profile is built dynamically from your trading data and updates as new trades are added.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
              </div>
              {s.value && <p className="text-sm font-medium">{s.value}</p>}
              {s.values && s.values.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.values.map((v) => (
                    <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground">{v}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="w-3.5 h-3.5 text-success" />Strengths</CardTitle></CardHeader>
          <CardContent>
            {profile.strengths.length > 0 ? (
              <ul className="space-y-1">{profile.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-success">+</span>{s}</li>)}</ul>
            ) : <p className="text-xs text-muted-foreground">No strengths identified yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning" />Weaknesses</CardTitle></CardHeader>
          <CardContent>
            {profile.weaknesses.length > 0 ? (
              <ul className="space-y-1">{profile.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-destructive">-</span>{w}</li>)}</ul>
            ) : <p className="text-xs text-muted-foreground">No significant weaknesses detected.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Target className="w-3 h-3 text-primary" />Strong Strategies</CardTitle></CardHeader>
          <CardContent>{profile.strong_strategies.length > 0 ? <div className="flex flex-wrap gap-1">{profile.strong_strategies.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">{s}</span>)}</div> : <p className="text-xs text-muted-foreground">None identified.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-warning" />Weak Strategies</CardTitle></CardHeader>
          <CardContent>{profile.weak_strategies.length > 0 ? <div className="flex flex-wrap gap-1">{profile.weak_strategies.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">{s}</span>)}</div> : <p className="text-xs text-muted-foreground">None identified.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><Brain className="w-3 h-3 text-primary" />Psychological Patterns</CardTitle></CardHeader>
          <CardContent>{profile.psychological_patterns.length > 0 ? <div className="flex flex-wrap gap-1">{profile.psychological_patterns.map((p) => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{p}</span>)}</div> : <p className="text-xs text-muted-foreground">None detected.</p>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-primary" />Learning Priorities</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {profile.learning_priorities.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {profile.common_mistakes.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-destructive" />Common Mistakes</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-1">{profile.common_mistakes.map((m) => <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{m}</span>)}</div></CardContent>
        </Card>
      )}
    </div>
  );
}
