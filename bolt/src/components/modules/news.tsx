'use client';
import { Newspaper, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type NewsItem = { id: string; title: string; source: string; time: string; sentiment: 'positive' | 'negative' | 'neutral'; summary: string };

const SAMPLE_NEWS: NewsItem[] = [
  { id: '1', title: 'Dollar firms as Fed officials signal patience on rate cuts', source: 'Reuters', time: '2h ago', sentiment: 'positive', summary: 'The US dollar strengthened after several Fed officials indicated that rate cuts may be slower than markets expect.' },
  { id: '2', title: 'Gold holds near record high amid geopolitical tensions', source: 'Bloomberg', time: '3h ago', sentiment: 'positive', summary: 'Gold remained near record levels as safe-haven demand continued amid ongoing geopolitical uncertainties.' },
  { id: '3', title: 'Oil prices slip on demand concerns', source: 'CNBC', time: '4h ago', sentiment: 'negative', summary: 'Crude oil futures declined as concerns about global demand growth weighed on sentiment.' },
  { id: '4', title: 'EUR/USD steadies as ECB signals data-dependent approach', source: 'FXStreet', time: '5h ago', sentiment: 'neutral', summary: 'The euro held steady against the dollar after ECB officials reiterated their data-dependent stance on future policy.' },
];

export function NewsCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Newspaper className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">News Center</h2><p className="text-sm text-muted-foreground">AI-curated financial news</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SAMPLE_NEWS.map((n) => {
          const Icon = n.sentiment === 'positive' ? TrendingUp : n.sentiment === 'negative' ? TrendingDown : Newspaper;
          const color = n.sentiment === 'positive' ? 'text-success' : n.sentiment === 'negative' ? 'text-destructive' : 'text-muted-foreground';
          return (
            <Card key={n.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('grid place-items-center w-9 h-9 rounded-lg shrink-0 bg-secondary/60', color)}><Icon className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.summary}</div>
                    <div className="flex items-center gap-2 mt-2"><span className="text-[10px] text-muted-foreground">{n.source}</span><span className="text-[10px] text-muted-foreground">·</span><span className="text-[10px] text-muted-foreground">{n.time}</span><Badge variant={n.sentiment === 'positive' ? 'success' : n.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-[9px] uppercase">{n.sentiment}</Badge></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
