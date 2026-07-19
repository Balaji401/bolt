'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Send, Sparkles, Loader2, RefreshCw, MessageSquare, User, TrendingUp,
  BarChart3, Target, Brain, Zap, Trophy,
} from 'lucide-react';
import { supabase, type Trade } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string; ts: string };

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp,  text: 'Why am I losing money?' },
  { icon: Target,      text: 'What is my best strategy?' },
  { icon: BarChart3,   text: 'Which pair gives me the highest profits?' },
  { icon: Zap,         text: 'What time do I perform best?' },
  { icon: Brain,       text: 'How can I improve my win rate?' },
  { icon: Trophy,      text: 'Show my biggest mistakes.' },
];

export function AiChat({ trades }: { trades: Trade[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const metrics = computeMetrics(trades);

  // Build context object for the edge function
  const context = {
    totalTrades: metrics.totalTrades,
    winRate: metrics.winRate,
    netPnl: metrics.netPnl,
    avgRR: metrics.avgRR,
    profitFactor: metrics.profitFactor,
    bestInstrument: metrics.byInstrument[0]?.instrument || '',
    worstInstrument: metrics.byInstrument[metrics.byInstrument.length - 1]?.instrument || '',
    bestSession: metrics.bySession.sort((a, b) => b.winRate - a.winRate)[0]?.session || '',
    worstSession: metrics.bySession.sort((a, b) => a.winRate - b.winRate)[0]?.session || '',
    bestWeekday: metrics.byWeekday.sort((a, b) => b.winRate - a.winRate)[0]?.day || '',
    currentStreak: metrics.currentStreak,
    maxDrawdown: metrics.maxDrawdown,
  };

  // Load recent chat history on mount
  useEffect(() => {
    supabase
      .from('ai_chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const history = [...data].reverse().map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            ts: m.created_at,
          }));
          setMessages(history);
        } else {
          setMessages([{
            role: 'assistant',
            content: `Hey! I'm your TraderOS AI Coach — powered by your actual trade data.\n\nYou have **${metrics.totalTrades} trades** logged with a **${metrics.winRate.toFixed(1)}% win rate** and **${metrics.profitFactor.toFixed(2)} profit factor**.\n\nAsk me anything about your trading — I'll give you direct, data-driven answers.`,
            ts: new Date().toISOString(),
          }]);
        }
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            Authorization: `Bearer ${token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: msg,
            context,
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            sessionId,
          }),
        }
      );

      const data = await res.json();
      const reply = data.reply || data.error || 'Sorry, something went wrong. Please try again.';

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: reply,
        ts: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Network error — check your connection and try again.',
        ts: new Date().toISOString(),
      }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    await supabase.from('ai_chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setMessages([{
      role: 'assistant',
      content: 'Chat history cleared. Ask me anything about your trading!',
      ts: new Date().toISOString(),
    }]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 lg:flex-row animate-fade-in">
      {/* Left: suggested questions panel */}
      <div className="lg:w-64 shrink-0 space-y-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Your Stats</span>
          </div>
          <div className="space-y-2">
            {[
              ['Trades', metrics.totalTrades.toString()],
              ['Win Rate', `${metrics.winRate.toFixed(1)}%`],
              ['Net P&L', `$${metrics.netPnl.toFixed(0)}`],
              ['Avg R:R', metrics.avgRR.toFixed(2)],
              ['Prof. Factor', metrics.profitFactor.toFixed(2)],
              ['Max DD', `${metrics.maxDrawdown.toFixed(1)}%`],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{l}</span>
                <span className="text-xs font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Ask me…</span>
          </div>
          <div className="space-y-1.5">
            {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                onClick={() => send(text)}
                disabled={busy}
                className="w-full flex items-start gap-2 p-2 rounded-lg text-left text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                {text}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground border border-border hover:border-destructive/40 hover:text-destructive transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Clear chat history
        </button>
      </div>

      {/* Right: chat window */}
      <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">TraderOS AI</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft inline-block" />
              Analyzing your {metrics.totalTrades} trades
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-7 h-7 rounded-full bg-primary/15 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Analyzing your trades…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary/60 border border-border focus-within:border-primary transition-colors"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your trading…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Responses are based on your actual trade data · Add your OpenAI key to unlock full AI
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  // Parse markdown-style bold (**text**) and line breaks
  const formatted = message.content
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < message.content.split('\n').length - 1 && <br />}
        </span>
      );
    });

  return (
    <div className={cn('flex items-start gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'grid place-items-center w-7 h-7 rounded-full shrink-0 text-white text-xs font-semibold mt-0.5',
        isUser ? 'bg-secondary border border-border' : 'bg-gradient-to-br from-primary to-chart-4'
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-muted-foreground" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'glass rounded-tl-sm'
      )}>
        {formatted}
      </div>
    </div>
  );
}
