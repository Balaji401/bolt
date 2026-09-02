'use client';
import { Brain, Sparkles, MessageSquare, Target, Repeat, AlertTriangle, Zap, TrendingUp, Lightbulb, CalendarRange } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const AI_FEATURES = [
  { icon: Brain, title: 'AI Coach', description: 'Personalized trading psychology coaching based on your patterns', color: 'text-primary bg-primary/10' },
  { icon: MessageSquare, title: 'AI Daily Reflection', description: 'Daily AI-powered reflection on your trading mindset', color: 'text-chart-2 bg-chart-2/10' },
  { icon: CalendarRange, title: 'AI Weekly Coach', description: 'Weekly AI analysis of your psychology and discipline trends', color: 'text-chart-3 bg-chart-3/10' },
  { icon: Sparkles, title: 'AI Monthly Coach', description: 'Deep monthly psychology review with AI recommendations', color: 'text-chart-4 bg-chart-4/10' },
  { icon: Brain, title: 'AI Psychology Advisor', description: 'Real-time emotional state analysis and suggestions', color: 'text-chart-5 bg-chart-5/10' },
  { icon: Zap, title: 'AI Discipline Score', description: 'Dynamic discipline scoring powered by machine learning', color: 'text-success bg-success/10' },
  { icon: Repeat, title: 'AI Habit Coach', description: 'Smart habit recommendations based on your routine', color: 'text-warning bg-warning/10' },
  { icon: TrendingUp, title: 'AI Motivation', description: 'Personalized motivation based on your goals and progress', color: 'text-chart-1 bg-chart-1/10' },
  { icon: Target, title: 'AI Goal Advisor', description: 'AI-suggested goals based on your trading patterns', color: 'text-chart-2 bg-chart-2/10' },
  { icon: AlertTriangle, title: 'AI Mistake Detection', description: 'Automatic detection of recurring mistakes in your trades', color: 'text-destructive bg-destructive/10' },
];

export function PsychologyAIPlaceholders() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">AI Psychology Features — Coming Soon</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AI_FEATURES.map((f) => (
            <div key={f.title} className="relative rounded-xl border border-border p-4 overflow-hidden group hover:border-primary/20 transition-all">
              <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-medium text-muted-foreground bg-secondary rounded-bl-lg">SOON</div>
              <div className={cn('grid place-items-center w-9 h-9 rounded-lg mb-3', f.color)}>
                <f.icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium mb-1">{f.title}</div>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
