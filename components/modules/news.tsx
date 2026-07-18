'use client';

import { useState } from 'react';
import { Newspaper, Sparkles, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type NewsItem = {
  category: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
  time: string;
};

const NEWS: NewsItem[] = [
  { category: 'Forex', title: 'Dollar steadies ahead of Fed minutes', summary: 'The US dollar held firm against major peers as traders awaited the latest FOMC minutes for clues on the rate path. EURUSD trades near 1.0850.', sentiment: 'bullish', source: 'Reuters', time: '12m ago' },
  { category: 'Stocks', title: 'Tech rally pushes S&P 500 to record high', summary: 'Semiconductor and AI stocks led gains as earnings beat estimates. The S&P 500 closed up 0.8% at a new all-time high.', sentiment: 'bullish', source: 'Bloomberg', time: '34m ago' },
  { category: 'Crypto', title: 'Bitcoin reclaims $67k amid ETF inflows', summary: 'Spot Bitcoin ETFs saw $312M in net inflows yesterday, the largest single-day figure in three weeks. BTC trades at $67,420.', sentiment: 'bullish', source: 'CoinDesk', time: '1h ago' },
  { category: 'Commodities', title: 'Gold holds near record as yields slip', summary: 'XAUUSD trades at $2,478 as falling Treasury yields boost the non-yielding asset. Geopolitical tensions add to safe-haven demand.', sentiment: 'bullish', source: 'FXStreet', time: '1h ago' },
  { category: 'Oil', title: 'Crude drops on demand concerns', summary: 'Brent fell 1.2% to $81.40 after weak manufacturing data from China raised demand outlook concerns. WTI down 1.4% to $77.20.', sentiment: 'bearish', source: 'CNBC', time: '2h ago' },
  { category: 'Forex', title: 'Yen weakens past 157 as BoJ stays dovish', summary: 'USDJPY climbed to 157.30 after the Bank of Japan signaled patience on rate hikes, widening the yield gap with the US.', sentiment: 'bearish', source: 'Reuters', time: '2h ago' },
  { category: 'Stocks', title: 'Tesla slips on delivery miss', summary: 'TSLA fell 3.2% in premarket after reporting Q3 deliveries below consensus. Analysts flag pricing pressure in China.', sentiment: 'bearish', source: 'MarketWatch', time: '3h ago' },
  { category: 'Crypto', title: 'Ethereum L2 activity hits record', summary: 'Daily transactions on Ethereum Layer-2 networks crossed 12M for the first time, driven by Base and Arbitrum adoption.', sentiment: 'neutral', source: 'The Block', time: '4h ago' },
  { category: 'Global Markets', title: 'European equities mixed as PMIs disappoint', summary: 'Euro Stoxx 50 closed flat after manufacturing PMIs came in below expectations across Germany and France.', sentiment: 'neutral', source: 'FT', time: '5h ago' },
];

const CATEGORIES = ['All', 'Forex', 'Stocks', 'Crypto', 'Commodities', 'Oil', 'Global Markets'];

export function NewsCenter() {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? NEWS : NEWS.filter((n) => n.category === cat);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-xl p-5 flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg bg-primary/15 text-primary shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">AI News Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Markets are mixed ahead of the FOMC minutes. Tech leads equity gains while oil slips on China demand concerns. The dollar is firm against majors; gold holds near record highs on falling yields and safe-haven demand. Bitcoin reclaims $67k on renewed ETF inflows.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-1 w-fit flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((n, i) => (
          <div key={i} className="group glass rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/60 text-muted-foreground">{n.category}</span>
              <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded inline-flex items-center gap-1', n.sentiment === 'bullish' ? 'bg-success/15 text-success' : n.sentiment === 'bearish' ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground')}>
                {n.sentiment === 'bullish' ? <ArrowUpRight className="w-3 h-3" /> : n.sentiment === 'bearish' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {n.sentiment}
              </span>
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{n.time}</span>
            </div>
            <h4 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">{n.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{n.summary}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Newspaper className="w-3 h-3" /> {n.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
