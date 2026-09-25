'use client';
import { GitCompare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ComparisonTools() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Comparison Tools — Coming Soon</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Compare Date Ranges', desc: 'Compare performance across two time periods' },
            { title: 'Compare Accounts', desc: 'Side-by-side analysis of multiple trading accounts' },
            { title: 'Compare Strategies', desc: 'Evaluate which strategies perform best' },
            { title: 'Compare Instruments', desc: 'See which instruments are most profitable' },
            { title: 'Compare Sessions', desc: 'Analyze performance by trading session' },
            { title: 'Compare Timeframes', desc: 'Evaluate trades across different timeframes' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-dashed border-border p-3 opacity-60 hover:opacity-100 transition-opacity">
              <div className="text-xs font-semibold mb-1">{item.title}</div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
