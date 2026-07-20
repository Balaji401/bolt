'use client';

import { useState } from 'react';
import {
  Newspaper, Sparkles, ArrowUpRight, ArrowDownRight, Clock, X,
  BookOpen, Share2, Tag, TrendingUp, TrendingDown, Minus, ExternalLink,
} from 'lucide-react';
import { useTimezone } from '@/components/timezone-provider';
import { cn } from '@/lib/utils';

type NewsItem = {
  id: number;
  category: string;
  title: string;
  summary: string;
  body: string[];           // paragraphs for in-app reading
  keyPoints: string[];      // bullet points
  marketImpact: string;     // what traders should watch
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
  sourceUrl: string;        // kept for attribution only — NOT opened
  author: string;
  time: string;
  readTime: string;
  tags: string[];
};

const NEWS: NewsItem[] = [
  {
    id: 1,
    category: 'Forex',
    title: 'Dollar steadies ahead of Fed minutes',
    summary: 'The US dollar held firm against major peers as traders awaited the latest FOMC minutes for clues on the rate path. EURUSD trades near 1.0850.',
    body: [
      'The US dollar consolidated near a one-week high on Monday as currency markets braced for the release of the Federal Open Market Committee meeting minutes, which investors hope will shed light on the timeline for potential interest rate cuts.',
      'The DXY Index, which measures the greenback against a basket of six major currencies, was nearly flat at 104.72, holding above Friday\'s close after a modest rebound from last week\'s lows.',
      'EURUSD hovered at 1.0851, down 0.1% on the session, as disappointing flash PMI data from Germany and France weighed on the single currency. The German Manufacturing PMI came in at 42.6, missing expectations of 44.0 and reinforcing concerns about a prolonged industrial recession in Europe.',
      'Meanwhile, GBPUSD traded at 1.2673, also under modest pressure ahead of UK inflation data due Tuesday. Traders are pricing approximately two Bank of England rate cuts for 2024, versus three-to-four for the Federal Reserve.',
      'The FOMC minutes, due at 2 PM EST, are closely watched after Chair Powell\'s recent comments that the central bank needs "more confidence" that inflation is moving sustainably toward 2% before cutting rates. Markets currently assign a 65% probability to a September cut, down from 75% a month ago.',
      'Commodity currencies were mixed: the Australian dollar edged lower to 0.6548 after weak Chinese industrial production data, while the New Zealand dollar held near 0.6102. The Canadian dollar was little changed at 1.3674 per USD ahead of domestic CPI on Tuesday.',
    ],
    keyPoints: [
      'DXY near 104.72 — holding above recent support',
      'EURUSD at 1.0851 — German PMI missed at 42.6',
      'FOMC minutes due at 2 PM EST — key rate-cut clues expected',
      'September Fed cut probability: 65% (down from 75%)',
      'UK CPI due Tuesday — will influence GBP direction',
    ],
    marketImpact: 'Watch for sharp DXY and EURUSD moves on the FOMC minutes release. A hawkish tone could push DXY toward 105.20 resistance. A dovish surprise could send EURUSD back to 1.0900.',
    sentiment: 'bullish',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    author: 'Reuters Markets Desk',
    time: '12m ago',
    readTime: '3 min read',
    tags: ['USD', 'EURUSD', 'Fed', 'FOMC', 'Interest Rates'],
  },
  {
    id: 2,
    category: 'Stocks',
    title: 'Tech rally pushes S&P 500 to record high',
    summary: 'Semiconductor and AI stocks led gains as earnings beat estimates. The S&P 500 closed up 0.8% at a new all-time high.',
    body: [
      'The S&P 500 closed at a fresh all-time high on Friday, led by a broad rally in technology stocks as better-than-expected earnings from several major semiconductor and artificial intelligence companies lifted sentiment across the sector.',
      'The benchmark index advanced 0.8% to close at 5,487.03, while the Nasdaq Composite surged 1.1% to 17,862.23. The Dow Jones Industrial Average gained 0.4%, closing above 39,000 for only the second time in its history.',
      'NVIDIA was the standout performer, jumping 4.2% after UBS raised its price target to $1,200, citing unprecedented demand for the company\'s H100 and forthcoming Blackwell GPU architecture from hyperscalers and AI startups alike. The move added approximately $90 billion to NVIDIA\'s market capitalization in a single session.',
      'Broadcom rose 3.8% after reporting fiscal Q2 revenue that beat analyst estimates by 4%, driven by its custom AI chip division. AMD gained 2.9% in sympathy.',
      'Apple inched 0.4% higher as analysts raised expectations ahead of the WWDC developer conference, where the company is expected to announce on-device AI features for iOS 18.',
      'The VIX, Wall Street\'s fear gauge, fell to 13.8 — its lowest level since January 2020 — reflecting broad investor complacency. Options market positioning suggests continued bullish sentiment in the near term, though some strategists warn that the index is "priced for perfection" entering earnings season.',
    ],
    keyPoints: [
      'S&P 500 at new ATH: 5,487.03 (+0.8%)',
      'NVIDIA +4.2% — UBS PT raised to $1,200',
      'Nasdaq +1.1% — semiconductor sector leads',
      'VIX drops to 13.8 — lowest since 2020',
      'Earnings season begins next week — key catalyst',
    ],
    marketImpact: 'Breakout above 5,450 resistance opens the door to 5,600 for the S&P 500. Watch NVDA as a bellwether for the AI trade — any correction here could pull the whole tech sector lower.',
    sentiment: 'bullish',
    source: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    author: 'Bloomberg Markets',
    time: '34m ago',
    readTime: '4 min read',
    tags: ['S&P 500', 'NVDA', 'Tech', 'AI', 'Semiconductors'],
  },
  {
    id: 3,
    category: 'Crypto',
    title: 'Bitcoin reclaims $67k amid ETF inflows',
    summary: 'Spot Bitcoin ETFs saw $312M in net inflows yesterday, the largest single-day figure in three weeks. BTC trades at $67,420.',
    body: [
      'Bitcoin climbed back above $67,000 on Monday, extending a five-day recovery as spot Bitcoin exchange-traded funds recorded their largest single-day net inflow in nearly three weeks, signaling renewed institutional appetite for the leading cryptocurrency.',
      'According to data compiled from on-chain analytics providers, the 11 spot Bitcoin ETFs approved in January collectively attracted $312 million in net new capital on Friday — with Fidelity\'s FBTC and BlackRock\'s IBIT leading with inflows of $124M and $98M respectively.',
      'Bitcoin traded at $67,420 at the time of writing, up 3.1% over the past 24 hours and recovering from the $63,200 low touched last Tuesday. The move higher came alongside a broader risk-on impulse in financial markets.',
      'On-chain metrics have been supportive: the long-term holder supply metric — tracking BTC held for more than 155 days — climbed to 14.9M coins, its highest level since October 2023, suggesting that longer-term investors are accumulating rather than distributing at current prices.',
      'Analysts at Bernstein Research maintained their $200,000 year-end price target, citing the structural supply reduction from the April halving, sustained ETF demand, and growing corporate treasury adoption as key drivers.',
      'Ethereum rose 2.3% to $3,542, with the market still awaiting a final SEC ruling on spot Ethereum ETF applications from VanEck and ARK Invest.',
    ],
    keyPoints: [
      'BTC at $67,420 — up 3.1% in 24 hours',
      'Spot ETF net inflows: $312M — 3-week high',
      'BlackRock IBIT inflows: $98M, Fidelity FBTC: $124M',
      'Long-term holder supply at 14.9M BTC — near highs',
      'ETH +2.3% at $3,542 — SEC ETH ETF decision awaited',
    ],
    marketImpact: 'Key level to watch is $68,500 — a daily close above this would confirm the short-term downtrend is broken and open a run toward $72,000. Support at $64,000 remains critical on any pullback.',
    sentiment: 'bullish',
    source: 'CoinDesk',
    sourceUrl: 'https://coindesk.com',
    author: 'CoinDesk Research',
    time: '1h ago',
    readTime: '4 min read',
    tags: ['BTC', 'ETH', 'ETF', 'Crypto', 'Institutional'],
  },
  {
    id: 4,
    category: 'Commodities',
    title: 'Gold holds near record as yields slip',
    summary: 'XAUUSD trades at $2,478 as falling Treasury yields boost the non-yielding asset. Geopolitical tensions add to safe-haven demand.',
    body: [
      'Gold prices remained near all-time highs on Monday, supported by a pullback in US Treasury yields and persistent geopolitical uncertainty in the Middle East, as investors weighed the outlook for Federal Reserve policy.',
      'XAUUSD traded at $2,478.30 per troy ounce, only $22 below the record high of $2,500.12 set last week. The precious metal has gained approximately 18% year-to-date, outperforming most major asset classes.',
      'The 10-year US Treasury yield dipped to 4.23%, its lowest in six weeks, after weaker-than-expected manufacturing data from the Philadelphia Fed region. Gold typically benefits when yields fall, as the opportunity cost of holding the non-yielding metal decreases.',
      'Ongoing tensions in the Red Sea, combined with uncertainty around the Israeli-Hamas ceasefire negotiations and geopolitical risk in Eastern Europe, continued to support safe-haven demand for gold.',
      'Central bank buying has been another major tailwind in 2024. The World Gold Council reported that central banks purchased 289.7 tonnes of gold in Q1 2024 alone — the strongest Q1 on record — with the People\'s Bank of China, National Bank of Poland, and Reserve Bank of India among the largest buyers.',
      'Silver outperformed gold on Monday, rising 1.4% to $29.85, as industrial demand drivers from the solar energy sector added to investment demand. The gold-silver ratio narrowed to 83, suggesting silver may have room to outperform on a relative basis.',
    ],
    keyPoints: [
      'XAUUSD at $2,478 — $22 below all-time high',
      '10-year yield dips to 4.23% — 6-week low',
      'Gold up 18% YTD — outperforming most assets',
      'Central banks bought 289.7t in Q1 — record Q1',
      'Silver +1.4% to $29.85 — gold-silver ratio at 83',
    ],
    marketImpact: 'If 10-year yields continue falling on softer macro data, gold could retest the $2,500 all-time high. A break above $2,500 would be a significant technical breakout. XAGUSD resistance at $30.50.',
    sentiment: 'bullish',
    source: 'FXStreet',
    sourceUrl: 'https://fxstreet.com',
    author: 'FXStreet Commodities Desk',
    time: '1h ago',
    readTime: '4 min read',
    tags: ['Gold', 'XAUUSD', 'Silver', 'Safe-Haven', 'Central Banks'],
  },
  {
    id: 5,
    category: 'Oil',
    title: 'Crude drops on demand concerns',
    summary: 'Brent fell 1.2% to $81.40 after weak manufacturing data from China raised demand outlook concerns. WTI down 1.4% to $77.20.',
    body: [
      'Crude oil prices retreated on Monday as disappointing Chinese economic data stoked concerns about demand from the world\'s largest importer of oil, overshadowing supply constraints from OPEC+ production cuts.',
      'Brent crude futures fell 1.2% to $81.40 per barrel, while West Texas Intermediate (WTI) dropped 1.4% to $77.20. Both benchmarks are down approximately 5% from their April highs but remain above their 200-day moving averages.',
      'China\'s National Bureau of Statistics reported industrial production growth of 5.6% year-over-year for May, below the 6.2% consensus estimate. Additionally, China\'s manufacturing PMI for June came in at 48.8, its second consecutive month in contraction territory and the weakest reading in five months.',
      'The demand picture is particularly sensitive given that China accounts for approximately 16% of global oil consumption and has been the primary driver of incremental demand growth in recent years.',
      'OPEC+ maintained its production cut agreement at last weekend\'s ministerial meeting, extending cuts of approximately 3.66 million barrels per day through 2025. However, the market had largely priced in this outcome, and attention is now shifting to compliance levels and whether members like Kazakhstan and Iraq will adhere to their quotas.',
      'Goldman Sachs maintained its year-end Brent forecast at $86 per barrel but noted that downside risks have increased if Chinese demand disappoints further. The bank sees strong support at $78 Brent from OPEC+ policy.',
    ],
    keyPoints: [
      'Brent at $81.40 — down 1.2%',
      'WTI at $77.20 — down 1.4%',
      'China industrial production misses — 5.6% vs 6.2% expected',
      'China PMI at 48.8 — contraction territory',
      'OPEC+ cuts extended through 2025',
    ],
    marketImpact: 'Brent has key support at $79.50. A break below this could trigger accelerated selling toward $76.00. To the upside, $83.50 is the first significant resistance. Watch Chinese demand data weekly for directional cues.',
    sentiment: 'bearish',
    source: 'CNBC',
    sourceUrl: 'https://cnbc.com',
    author: 'CNBC Energy Desk',
    time: '2h ago',
    readTime: '4 min read',
    tags: ['Oil', 'Brent', 'WTI', 'OPEC+', 'China'],
  },
  {
    id: 6,
    category: 'Forex',
    title: 'Yen weakens past 157 as BoJ stays dovish',
    summary: 'USDJPY climbed to 157.30 after the Bank of Japan signaled patience on rate hikes, widening the yield gap with the US.',
    body: [
      'The Japanese yen weakened past 157 per US dollar on Monday after Bank of Japan Governor Kazuo Ueda signaled that the central bank would proceed cautiously with any further rate normalization, reinforcing the wide interest rate differential between Japan and other major economies.',
      'USDJPY climbed to 157.30, its highest level since late April when Japanese authorities intervened in the currency market to prop up the yen. The pair has now retraced approximately 75% of those intervention-driven losses.',
      'The BoJ left its policy rate unchanged at 0.10% at last month\'s meeting and has been deliberate in its messaging around further hikes, citing persistent uncertainty about the durability of Japan\'s inflation and wage growth. This stands in stark contrast to the Federal Reserve, which maintains rates in a 5.25–5.50% target range.',
      'Currency strategists at MUFG noted that the 150 basis point US-Japan yield differential is "the dominant force" keeping USDJPY elevated, and that the pair could test 160 unless the BoJ signals a meaningful shift in its hiking timeline.',
      'Japanese Ministry of Finance officials have issued verbal warnings about "speculative" and "one-sided" yen moves on multiple occasions in recent weeks, but markets have so far tested the resolve of authorities to intervene again following the approximately $62 billion spent on currency intervention in April and May.',
      'Cross rates were also affected: EURJPY rose to 170.50, a fresh multi-decade high, while GBPJPY traded above 199 for the first time since 2008.',
    ],
    keyPoints: [
      'USDJPY at 157.30 — near April intervention levels',
      'BoJ holds at 0.10% — signals patience on hikes',
      'US-Japan rate differential: 150 bps — key driver',
      'Verbal intervention warnings from MoF continue',
      'EURJPY at 170.50 — multi-decade high',
    ],
    marketImpact: 'Watch 160.00 as the critical level where Japanese authorities may intervene physically. Any BoJ communication surprise or soft US data could trigger a sharp yen recovery — carry trade unwind risk is elevated above 158.',
    sentiment: 'bearish',
    source: 'Reuters',
    sourceUrl: 'https://reuters.com',
    author: 'Reuters Tokyo Bureau',
    time: '2h ago',
    readTime: '4 min read',
    tags: ['JPY', 'USDJPY', 'BoJ', 'Carry Trade', 'Intervention'],
  },
  {
    id: 7,
    category: 'Stocks',
    title: 'Tesla slips on delivery miss',
    summary: 'TSLA fell 3.2% in premarket after reporting Q3 deliveries below consensus. Analysts flag pricing pressure in China.',
    body: [
      'Tesla shares fell sharply in premarket trading after the electric vehicle maker reported Q3 2024 deliveries that fell short of Wall Street expectations, renewing concerns about demand softness and intensifying competition in key markets, particularly China.',
      'Tesla delivered 435,059 vehicles in Q3, below the consensus estimate of 447,000 and down from 466,140 in Q2. The company also produced 469,796 vehicles in the quarter, resulting in a sequentially larger inventory build than expected.',
      'Analysts at Morgan Stanley, while maintaining their "overweight" rating, trimmed their delivery estimates for the full year and noted that China remains "the critical battleground" where BYD, Li Auto, and NIO continue to gain market share through aggressive pricing and rapid product cycles.',
      'Tesla has cut prices across its lineup in China four times in 2024, squeezing margins significantly. The company\'s gross margin in China is estimated to have fallen below 15%, according to Bernstein analysts, compared to approximately 25% in North America.',
      'The company\'s energy storage division was a bright spot: Tesla deployed 6.9 gigawatt-hours of its Megapack batteries in Q3, roughly double the year-ago period, as utilities and grid operators ramp up stationary storage investments.',
      'Full earnings, including the crucial gross margin figure, are scheduled for release on October 23. Options pricing implies a move of approximately ±8% on earnings day.',
    ],
    keyPoints: [
      'TSLA Q3 deliveries: 435,059 — miss vs 447,000 estimate',
      'Deliveries down from 466,140 in Q2',
      'China pricing pressure — gross margin estimated below 15%',
      'Energy storage deployment at 6.9 GWh — record',
      'Earnings date: October 23 — ±8% options implied move',
    ],
    marketImpact: 'TSLA key support at $220. A sustained break below could accelerate selling toward $205. Short-term bearish, but energy storage and FSD monetization could re-rate the stock higher into year-end.',
    sentiment: 'bearish',
    source: 'MarketWatch',
    sourceUrl: 'https://marketwatch.com',
    author: 'MarketWatch Auto Desk',
    time: '3h ago',
    readTime: '4 min read',
    tags: ['TSLA', 'EV', 'China', 'Tesla', 'Earnings'],
  },
  {
    id: 8,
    category: 'Crypto',
    title: 'Ethereum L2 activity hits record',
    summary: 'Daily transactions on Ethereum Layer-2 networks crossed 12M for the first time, driven by Base and Arbitrum adoption.',
    body: [
      'Ethereum Layer-2 (L2) networks recorded a historic milestone on Sunday, processing more than 12 million transactions in a single day for the first time — a figure that now surpasses Ethereum mainnet activity by more than 10x and underscores the rapid scaling progress of the broader Ethereum ecosystem.',
      'Base, the L2 network launched by Coinbase in August 2023, led activity with approximately 4.8M daily transactions, driven by a surge in social applications, microtransactions, and decentralized exchange activity. Arbitrum One recorded approximately 3.2M transactions, while Optimism processed 1.9M.',
      'The surge in L2 activity has been partly attributed to EIP-4844 (Proto-Danksharding), implemented in the Dencun upgrade in March 2024, which reduced L2 transaction fees by approximately 95% by introducing "blobs" as a cheaper data availability mechanism.',
      'Average transaction fees on Base dropped to $0.003 — comparable to traditional fintech payment processors — which has enabled use cases previously uneconomical on-chain, including micropayments, gaming transactions, and social tipping.',
      'Ethereum mainnet (L1) transaction volumes fell slightly as users migrated activity to cheaper L2s, but Ethereum\'s total value secured — encompassing both L1 and L2 activity — reached $398 billion, an all-time high.',
      'The ETH price response has been muted, however, as analysts note that increased L2 activity does not directly drive ETH demand the same way L1 activity does. The fee burn mechanism is less impactful when activity occurs on L2s rather than L1.',
    ],
    keyPoints: [
      'L2 daily transactions: 12M+ — all-time high',
      'Base leads with 4.8M txns, Arbitrum 3.2M',
      'Base average fee: $0.003 — down 95% post-Dencun',
      'ETH total value secured: $398B — ATH',
      'ETH price not directly benefiting from L2 growth',
    ],
    marketImpact: 'Structurally bullish for the Ethereum ecosystem long-term. Near-term ETH price may remain range-bound until a spot ETH ETF approval drives direct capital inflows. Watch the $3,400 level as key support.',
    sentiment: 'neutral',
    source: 'The Block',
    sourceUrl: 'https://theblock.co',
    author: 'The Block Research',
    time: '4h ago',
    readTime: '4 min read',
    tags: ['ETH', 'Layer 2', 'Base', 'Arbitrum', 'DeFi'],
  },
  {
    id: 9,
    category: 'Global Markets',
    title: 'European equities mixed as PMIs disappoint',
    summary: 'Euro Stoxx 50 closed flat after manufacturing PMIs came in below expectations across Germany and France.',
    body: [
      'European equity markets closed with little direction on Monday as a batch of disappointing purchasing managers\' index (PMI) data from the eurozone\'s two largest economies, Germany and France, reinforced concerns about the bloc\'s near-term economic trajectory.',
      'The Euro Stoxx 50 index ended the session essentially flat at 4,891.20, while Germany\'s DAX fell 0.3% to 18,482 and France\'s CAC 40 slipped 0.4% to 7,643. The UK\'s FTSE 100 outperformed, edging up 0.2% to 8,295 on the back of commodity and energy sector gains.',
      'Germany\'s flash Manufacturing PMI for June came in at 42.6, well below the 44.0 consensus estimate and the 42.5 prior reading, extending the industrial sector\'s contraction into its 24th consecutive month. Germany has now endured the longest manufacturing downturn of any major developed economy in the modern era.',
      'France\'s Services PMI surprised to the downside at 48.8, falling into contraction territory for the first time since February. Analysts attributed the miss to political uncertainty following President Macron\'s call for snap legislative elections.',
      'The European Central Bank cut its deposit rate by 25 basis points to 3.75% at its June meeting — its first cut since 2019 — and markets are now pricing approximately two more cuts by year-end. However, the weak PMI data raises the question of whether the ECB will need to accelerate its easing pace.',
      'On the earnings front, Siemens Energy rose 2.8% after announcing an expanded contract for high-voltage direct current (HVDC) grid infrastructure in Scandinavia. ASML fell 1.1% on concerns about renewed US export restrictions on semiconductor equipment to China.',
    ],
    keyPoints: [
      'Euro Stoxx 50 flat at 4,891.20',
      'German Manufacturing PMI: 42.6 — 24th month in contraction',
      'France Services PMI at 48.8 — below 50 for first time since Feb',
      'ECB cut to 3.75% — two more cuts priced by year-end',
      'FTSE 100 outperforms on commodity/energy sector strength',
    ],
    marketImpact: 'Euro Stoxx 50 faces resistance at 4,950. Continued weak PMI data could push the index back to 4,750 support. EURUSD vulnerable on ECB dovishness vs Fed. Watch French political risk as an ongoing tail risk.',
    sentiment: 'neutral',
    source: 'Financial Times',
    sourceUrl: 'https://ft.com',
    author: 'FT Markets Desk',
    time: '5h ago',
    readTime: '5 min read',
    tags: ['Euro Stoxx', 'PMI', 'ECB', 'Germany', 'France'],
  },
];

const CATEGORIES = ['All', 'Forex', 'Stocks', 'Crypto', 'Commodities', 'Oil', 'Global Markets'];

const SENTIMENT_META = {
  bullish: { label: 'Bullish', icon: ArrowUpRight, color: 'bg-success/15 text-success' },
  bearish: { label: 'Bearish', icon: ArrowDownRight, color: 'bg-destructive/15 text-destructive' },
  neutral: { label: 'Neutral', icon: Minus, color: 'bg-secondary text-muted-foreground' },
};

export function NewsCenter() {
  const [cat, setCat]             = useState('All');
  const [selected, setSelected]   = useState<NewsItem | null>(null);
  const { formatTime } = useTimezone();

  const filtered = cat === 'All' ? NEWS : NEWS.filter((n) => n.category === cat);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* AI summary */}
      <div className="glass rounded-xl p-5 flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg bg-primary/15 text-primary shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">AI Market Brief</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Markets are mixed ahead of the FOMC minutes. Tech leads equity gains while oil slips on China demand concerns. The dollar is firm against majors; gold holds near record highs on falling yields and safe-haven demand. Bitcoin reclaims $67k on renewed ETF inflows. European PMIs disappointed — watch ECB tone. Yen weakening resumes — intervention risk elevated above 158.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-1 w-fit flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* News grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((n) => {
          const sm = SENTIMENT_META[n.sentiment];
          const SentimentIcon = sm.icon;
          return (
            <button
              key={n.id}
              onClick={() => setSelected(n)}
              className="group glass rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/60 text-muted-foreground">{n.category}</span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded inline-flex items-center gap-1', sm.color)}>
                  <SentimentIcon className="w-3 h-3" />{sm.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{n.time}
                </span>
              </div>
              <h4 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">{n.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.summary}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Newspaper className="w-3 h-3" /> {n.source}
                </div>
                <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <BookOpen className="w-3 h-3" /> Read full story
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Article viewer modal */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} formatTime={formatTime} />
      )}
    </div>
  );
}

// ── Article Modal ──────────────────────────────────────────────────────────────
function ArticleModal({
  article,
  onClose,
  formatTime,
}: {
  article: NewsItem;
  onClose: () => void;
  formatTime: (d: Date | string) => string;
}) {
  const sm = SENTIMENT_META[article.sentiment];
  const SentimentIcon = sm.icon;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/90 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/60 text-muted-foreground">{article.category}</span>
            <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded inline-flex items-center gap-1', sm.color)}>
              <SentimentIcon className="w-3 h-3" />{sm.label}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Article content */}
        <div className="px-6 py-5 space-y-5">
          {/* Title + meta */}
          <div>
            <h2 className="text-xl font-semibold leading-tight mb-3">{article.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Newspaper className="w-3.5 h-3.5" /> {article.source}</span>
              <span>{article.author}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.time}</span>
              <span>{article.readTime}</span>
            </div>
          </div>

          {/* Summary / lead */}
          <p className="text-sm text-muted-foreground leading-relaxed font-medium border-l-2 border-primary pl-4 italic">
            {article.summary}
          </p>

          {/* Body paragraphs */}
          <div className="space-y-3">
            {article.body.map((para, i) => (
              <p key={i} className="text-sm leading-relaxed">{para}</p>
            ))}
          </div>

          {/* Key points */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Points</span>
            </div>
            <ul className="space-y-1.5">
              {article.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5 font-bold">·</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Market impact */}
          <div className={cn(
            'rounded-xl p-4 border',
            article.sentiment === 'bullish' ? 'bg-success/5 border-success/20' :
            article.sentiment === 'bearish' ? 'bg-destructive/5 border-destructive/20' :
            'bg-secondary/40 border-border'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <SentimentIcon className={cn('w-4 h-4', article.sentiment === 'bullish' ? 'text-success' : article.sentiment === 'bearish' ? 'text-destructive' : 'text-muted-foreground')} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What to Watch — Trader Perspective</span>
            </div>
            <p className="text-sm leading-relaxed">{article.marketImpact}</p>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {article.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

          {/* Source attribution — no external link opened */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              This article is sourced and summarized from <span className="font-semibold text-foreground">{article.source}</span>. Content is curated for informational purposes within TraderOS. All original reporting rights belong to {article.source}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
