'use client';
import { useState } from 'react';
import { Calculator, DollarSign, Percent, AlertTriangle, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getSpec, pipValuePerLot, getAllInstruments } from '@/lib/instruments';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/components/workspace-provider';
import { emit } from '@/lib/event-bus';

export function RiskCalculator() {
  const { activeAccount } = useWorkspace();
  const [accountSize, setAccountSize] = useState(activeAccount ? String(activeAccount.current_balance) : '10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [instrument, setInstrument] = useState('EURUSD');
  const [direction, setDirection] = useState('long');
  const [copied, setCopied] = useState(false);

  const account = parseFloat(accountSize) || 0;
  const riskPct = parseFloat(riskPercent) || 0;
  const riskAmount = account * (riskPct / 100);
  const entryPrice = parseFloat(entry) || 0;
  const slPrice = parseFloat(stopLoss) || 0;
  const tpPrice = parseFloat(takeProfit) || 0;

  const slDistance = entryPrice > 0 && slPrice > 0 ? Math.abs(entryPrice - slPrice) : 0;
  const tpDistance = entryPrice > 0 && tpPrice > 0 ? Math.abs(tpPrice - entryPrice) : 0;
  const rr = slDistance > 0 && tpDistance > 0 ? tpDistance / slDistance : 0;

  const pipVal = pipValuePerLot(instrument);
  const spec = getSpec(instrument);
  const pipSize = spec?.pipSize || 0.0001;
  const slPips = slDistance > 0 && pipSize > 0 ? slDistance / pipSize : 0;
  const positionSize = slPips > 0 && pipVal > 0 ? riskAmount / (slPips * pipVal) : 0;
  const lots = positionSize;
  const units = lots * (spec?.contractSize || 100000);
  const potentialProfit = tpDistance > 0 && pipSize > 0 ? (tpDistance / pipSize) * pipVal * lots : 0;

  const instruments = getAllInstruments();

  const copyToTrade = () => {
    emit('journal:prefill-trade', {
      instrument,
      direction,
      entry_price: entryPrice || undefined,
      stop_loss: slPrice || undefined,
      take_profit: tpPrice || undefined,
      risk_pct: riskPct,
      quantity: lots || undefined,
    }, 'page');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4" /> Position Size Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Account Balance ($)</Label><Input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} /></div>
            <div className="space-y-2"><Label>Risk per Trade (%)</Label><Input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} /></div>
            <div className="space-y-2"><Label>Instrument</Label>
              <Select value={instrument} onValueChange={setInstrument}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {instruments.map((i) => <SelectItem key={i.symbol} value={i.symbol}>{i.symbol} — {i.name}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="long">Long</SelectItem><SelectItem value="short">Short</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Entry Price</Label><Input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="1.0850" /></div>
            <div className="space-y-2"><Label>Stop Loss</Label><Input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="1.0800" /></div>
            <div className="col-span-2 space-y-2"><Label>Take Profit (optional)</Label><Input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="1.1000" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Results</CardTitle>
          <Button variant="outline" size="sm" onClick={copyToTrade} disabled={!entryPrice || !slPrice}>
            {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy to Trade</>}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResultRow icon={DollarSign} label="Risk Amount" value={formatCurrency(riskAmount)} color="text-destructive" />
          <ResultRow icon={Percent} label="Stop Loss Distance" value={`${formatNumber(slPips, 1)} pips`} color="text-foreground" />
          <ResultRow icon={Percent} label="Pip Value" value={formatCurrency(pipVal)} color="text-foreground" />
          <ResultRow icon={Percent} label="R:R Ratio" value={rr > 0 ? `1:${rr.toFixed(2)}` : '—'} color="text-primary" />
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10"><div className="text-xs text-muted-foreground mb-1">Suggested Lot Size</div><div className="text-2xl font-bold text-primary">{formatNumber(lots, 2)}</div><div className="text-xs text-muted-foreground">lots</div></div>
              <div className="text-center p-4 rounded-lg bg-secondary/60"><div className="text-xs text-muted-foreground mb-1">Units</div><div className="text-2xl font-bold">{formatNumber(units, 0)}</div><div className="text-xs text-muted-foreground">units</div></div>
            </div>
          </div>
          {potentialProfit > 0 && <ResultRow icon={DollarSign} label="Potential Profit" value={formatCurrency(potentialProfit)} color="text-success" />}
          {riskPct > 2 && <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-2"><AlertTriangle className="w-3.5 h-3.5" /> Risk above 2% per trade is considered aggressive.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-4 h-4" /> {label}</div><span className={cn('text-sm font-semibold', color)}>{value}</span></div>;
}
