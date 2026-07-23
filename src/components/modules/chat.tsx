'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { computeMetrics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';

type Msg = { role: 'user' | 'assistant'; content: string };

export function AiChat({ trades }: { trades: Trade[] }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
        body: JSON.stringify({ message: userMsg, trades: trades.slice(0, 50) }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const assistantMsg = data.response || data.message || 'Sorry, I could not process that request.';
      setMessages((m) => [...m, { role: 'assistant', content: assistantMsg }]);
    } catch {
      const metrics = computeMetrics(trades);
      const fallback = generateFallback(userMsg, metrics, trades);
      setMessages((m) => [...m, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">AI Trading Assistant</h2><p className="text-sm text-muted-foreground">Ask anything about your trades</p></div></div>
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {messages.length === 0 ? (
              <EmptyState icon={Sparkles} title="Start a conversation" description="Ask about your trading performance, specific trades, or strategies. Try: 'How am I doing this month?'" />
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                  <div className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>{m.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}</div>
                  <div className={cn('rounded-lg px-3 py-2 max-w-[80%] text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>{m.content}</div>
                </div>
              ))
            )}
            {loading && <div className="flex gap-3"><div className="grid place-items-center w-8 h-8 rounded-lg bg-secondary"><Sparkles className="w-4 h-4 text-muted-foreground" /></div><div className="rounded-lg px-3 py-2 bg-secondary text-sm text-muted-foreground flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Thinking...</div></div>}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about your trades..." className="flex-1" />
            <Button onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateFallback(query: string, metrics: ReturnType<typeof computeMetrics>, trades: Trade[]): string {
  const q = query.toLowerCase();
  if (q.includes('win rate')) return `Your win rate is ${metrics.winRate.toFixed(1)}% with ${metrics.totalWins} wins and ${metrics.totalLosses} losses out of ${metrics.totalTrades} total trades.`;
  if (q.includes('profit') || q.includes('pnl') || q.includes('p&l')) return `Your total P&L is ${formatCurrency(metrics.totalPnl)} with a profit factor of ${metrics.profitFactor.toFixed(2)}. Your average win is ${formatCurrency(metrics.avgWin)} and average loss is ${formatCurrency(-metrics.avgLoss)}.`;
  if (q.includes('best') || q.includes('worst')) return `Your best trade made ${formatCurrency(metrics.bestTrade)} and your worst lost ${formatCurrency(metrics.worstTrade)}. Your longest winning streak is ${metrics.maxWinStreak} trades.`;
  if (q.includes('how am i') || q.includes('summary') || q.includes('doing')) return `Here's your summary: ${metrics.totalTrades} trades, ${metrics.winRate.toFixed(1)}% win rate, ${formatCurrency(metrics.totalPnl)} total P&L, profit factor ${metrics.profitFactor.toFixed(2)}.`;
  return `I can see you have ${trades.length} trades. Your win rate is ${metrics.winRate.toFixed(1)}% and total P&L is ${formatCurrency(metrics.totalPnl)}. Ask me about your win rate, profit factor, best/worst trades, or overall performance.`;
}
