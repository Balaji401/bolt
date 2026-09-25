'use client';
import { Sparkles, Shield, Brain, Target, TrendingUp, DollarSign, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AI_PLACEHOLDERS = [
  { icon: Shield, title: 'AI Risk Advisor', description: 'Real-time risk assessment and recommendations based on your trading patterns' },
  { icon: Target, title: 'AI Risk Score', description: 'Automatic scoring of your overall risk management quality' },
  { icon: TrendingUp, title: 'AI Exposure Analysis', description: 'Intelligent analysis of your current market exposure and concentration risk' },
  { icon: DollarSign, title: 'AI Position Size Recommendation', description: 'Optimal position sizing suggestions based on market conditions and history' },
  { icon: Brain, title: 'AI Rule Suggestions', description: 'Personalized risk rule recommendations based on your trading behavior' },
  { icon: Lightbulb, title: 'AI Capital Preservation Tips', description: 'Smart tips to protect your capital during drawdown periods' },
];

export function RiskAiPlaceholders() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">AI Risk Intelligence — Coming Soon</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
