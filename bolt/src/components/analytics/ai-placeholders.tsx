'use client';
import { Sparkles, Brain, Target, MessageSquare, FileText, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AI_PLACEHOLDERS = [
  { icon: Brain, title: 'AI Coach', description: 'Personalized coaching based on your trading patterns' },
  { icon: MessageSquare, title: 'AI Chat', description: 'Ask questions about your performance and get insights' },
  { icon: Target, title: 'AI Trade Score', description: 'Automatic scoring of each trade execution quality' },
  { icon: FileText, title: 'AI Daily Summary', description: 'Daily automated review of your trading activity' },
  { icon: TrendingUp, title: 'AI Weekly Summary', description: 'Weekly performance trends and pattern detection' },
  { icon: FileText, title: 'AI Monthly Review', description: 'Comprehensive monthly performance analysis' },
  { icon: Shield, title: 'AI Risk Advisor', description: 'Real-time risk assessment and position sizing suggestions' },
  { icon: Target, title: 'AI Strategy Advisor', description: 'Strategy optimization recommendations based on data' },
];

export function AiPlaceholders() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">AI Insights — Coming Soon</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AI_PLACEHOLDERS.map((p) => (
            <div key={p.title} className="rounded-lg border border-dashed border-border p-3 opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-1">
                <div className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10">
                  <p.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold">{p.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
