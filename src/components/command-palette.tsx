'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Upload, MessageSquare, LayoutDashboard, BookOpen, BarChart3, Calculator, Sparkles, CalendarDays, Newspaper, HeartPulse, Plug, Trophy, Target, Settings as SettingsIcon, Clock, ArrowRight, History, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { search, loadRecentSearches, saveRecentSearch, clearRecentSearches, highlightMatch, type SearchResult } from '@/lib/search';
import { MODULES, type ModuleKey } from '@/lib/module-registry';

type QuickAction = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string; action: () => void };

export function CommandPalette({ open, onClose, onNavigate, onNewTrade, onImportTrades, onOpenChat }: { open: boolean; onClose: () => void; onNavigate: (key: ModuleKey) => void; onNewTrade?: () => void; onImportTrades?: () => void; onOpenChat?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    { id: 'new-trade', label: 'New Trade', icon: Plus, shortcut: 'N', action: () => { onNewTrade?.(); onClose(); } },
    { id: 'import', label: 'Import Trades', icon: Upload, shortcut: 'I', action: () => { onImportTrades?.(); onClose(); } },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare, shortcut: 'C', action: () => { onOpenChat?.(); onClose(); } },
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'journal', label: 'Go to Journal', icon: BookOpen, action: () => { onNavigate('journal'); onClose(); } },
    { id: 'analytics', label: 'Go to Analytics', icon: BarChart3, action: () => { onNavigate('analytics'); onClose(); } },
    { id: 'risk', label: 'Go to Risk Management', icon: Calculator, action: () => { onNavigate('risk'); onClose(); } },
    { id: 'coach', label: 'Go to AI Coach', icon: Sparkles, action: () => { onNavigate('coach'); onClose(); } },
    { id: 'psychology', label: 'Go to Psychology', icon: HeartPulse, action: () => { onNavigate('psychology'); onClose(); } },
    { id: 'calendar', label: 'Go to Calendar', icon: CalendarDays, action: () => { onNavigate('calendar'); onClose(); } },
    { id: 'news', label: 'Go to News', icon: Newspaper, action: () => { onNavigate('news'); onClose(); } },
    { id: 'brokers', label: 'Go to Broker Sync', icon: Plug, action: () => { onNavigate('brokers'); onClose(); } },
    { id: 'accounts', label: 'Go to Accounts', icon: Wallet, action: () => { onNavigate('accounts'); onClose(); } },
    { id: 'achievements', label: 'Go to Achievements', icon: Trophy, action: () => { onNavigate('achievements'); onClose(); } },
    { id: 'plan', label: 'Go to Trading Plan', icon: Target, action: () => { onNavigate('plan'); onClose(); } },
    { id: 'settings', label: 'Go to Settings', icon: SettingsIcon, action: () => { onNavigate('settings'); onClose(); } },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (open) onClose(); else window.dispatchEvent(new CustomEvent('traderos:open-command-palette')); }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) { setQuery(''); setActiveIndex(0); setShowRecent(true); setRecentSearches(loadRecentSearches()); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowRecent(true); return; }
    setShowRecent(false);
    const searchResults = search(query);
    const actionResults: SearchResult[] = quickActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())).map((a) => ({ id: `action-${a.id}`, title: a.label, category: 'actions' as const, action: { type: 'callback' as const, callback: a.action }, score: 95 }));
    setResults([...actionResults, ...searchResults]);
    setActiveIndex(0);
  }, [query]);

  useEffect(() => { const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`); el?.scrollIntoView({ block: 'nearest' }); }, [activeIndex]);

  const handleExecute = useCallback((result: SearchResult) => {
    if (query.trim()) saveRecentSearch(query.trim());
    if (result.action?.type === 'navigate' && result.action.module) { onNavigate(result.action.module); onClose(); }
    else if (result.action?.type === 'callback' && result.action.callback) result.action.callback();
  }, [query, onNavigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const r = results[activeIndex]; if (r) handleExecute(r); }
  };

  if (!open) return null;

  const categoryLabels: Record<string, string> = { trades: 'Trades', accounts: 'Accounts', strategies: 'Strategies', tags: 'Tags', sessions: 'Sessions', reports: 'Reports', prop_firms: 'Prop Firms', brokers: 'Brokers', notes: 'Notes', mistakes: 'Mistakes', lessons: 'Lessons', ai_conversations: 'AI Conversations', market_events: 'Market Events', settings: 'Settings', documentation: 'Documentation', modules: 'Modules', actions: 'Quick Actions' };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl border border-border shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search trades, strategies... or try 'Show Gold trades'" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {showRecent && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><History className="w-3 h-3" /> Recent Searches</span><button onClick={() => { clearRecentSearches(); setRecentSearches([]); }} className="text-[10px] text-muted-foreground hover:text-destructive">Clear</button></div>
              {recentSearches.map((q) => (<button key={q} onClick={() => setQuery(q)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors text-left"><Clock className="w-3.5 h-3.5 shrink-0" />{q}</button>))}
            </div>
          )}
          {showRecent && recentSearches.length === 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</div>
              {quickActions.slice(0, 6).map((action) => { const Icon = action.icon; return (<button key={action.id} onClick={action.action} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left group"><Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" /><span className="flex-1">{action.label}</span>{action.shortcut && <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{action.shortcut}</kbd>}</button>); })}
              <div className="px-2 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Modules</div>
              {MODULES.filter((m) => !m.comingSoon).slice(0, 6).map((m) => { const Icon = m.icon; return (<button key={m.key} onClick={() => { onNavigate(m.key); onClose(); }} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"><Icon className="w-4 h-4 text-muted-foreground shrink-0" /><span className="flex-1">{m.label}</span><ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" /></button>); })}
            </div>
          )}
          {!showRecent && results.length === 0 && query.trim() && <div className="py-12 text-center text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</div>}
          {!showRecent && results.length > 0 && (
            <div className="p-2">
              {results.map((result, idx) => (<button key={result.id} data-idx={idx} onClick={() => handleExecute(result)} onMouseEnter={() => setActiveIndex(idx)} className={cn('w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-left transition-colors', idx === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60')}><div className="flex-1 min-w-0"><div className="font-medium truncate">{highlightMatch(result.title, query).map((part, i) => (<span key={i} className={part.isMatch ? 'bg-primary/20 rounded px-0.5' : ''}>{part.text}</span>))}</div>{result.subtitle && <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>}</div><span className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">{categoryLabels[result.category] || result.category}</span></button>))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3"><span className="flex items-center gap-1"><kbd className="border border-border rounded px-1 py-0.5">↑↓</kbd> Navigate</span><span className="flex items-center gap-1"><kbd className="border border-border rounded px-1 py-0.5">↵</kbd> Select</span></div>
          <span>TraderOS Search</span>
        </div>
      </div>
    </div>
  );
}
