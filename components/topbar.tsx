'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Plus, Crown, Sun, Moon, MessageSquare, Globe, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTimezone, COMMON_TIMEZONES } from '@/components/timezone-provider';
import { cn } from '@/lib/utils';

export function Topbar({
  title,
  subtitle,
  onAdd,
  onShowPlans,
  onOpenChat,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  onShowPlans?: () => void;
  onOpenChat?: () => void;
}) {
  const { resolvedTheme, toggle } = useTheme();
  const { timezone, setTimezone, formatTime } = useTimezone();
  const [now, setNow] = useState(new Date());
  const [tzOpen, setTzOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const tzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredTzs = COMMON_TIMEZONES.filter((tz) =>
    tz.label.toLowerCase().includes(tzSearch.toLowerCase()) || tz.value.toLowerCase().includes(tzSearch.toLowerCase())
  );

  const currentTz = COMMON_TIMEZONES.find((tz) => tz.value === timezone) || COMMON_TIMEZONES[0];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-full px-4 lg:px-8 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border w-64 hover:border-primary/40 transition-colors focus-within:border-primary/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search trades, instruments..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden lg:block">
            ⌘K
          </kbd>
        </div>

        {/* Timezone + Live Clock */}
        <div className="relative" ref={tzRef}>
          <button
            onClick={() => setTzOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Select timezone"
          >
            <Globe className="w-4 h-4" />
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-xs font-medium tabular-nums text-foreground">{formatTime(now)}</span>
              <span className="text-[9px] text-muted-foreground">{currentTz.label.split(' ')[0]}</span>
            </div>
            <ChevronDown className={cn('w-3 h-3 transition-transform', tzOpen && 'rotate-180')} />
          </button>

          {tzOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 glass-strong rounded-xl border border-border shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={tzSearch}
                    onChange={(e) => setTzSearch(e.target.value)}
                    placeholder="Search timezone..."
                    className="bg-transparent text-xs outline-none flex-1 placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin py-1">
                {filteredTzs.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => {
                      setTimezone(tz.value);
                      setTzOpen(false);
                      setTzSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-secondary/60 transition-colors',
                      timezone === tz.value && 'text-primary'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{tz.label}</span>
                      {tz.offset && (
                        <span className="text-[10px] text-muted-foreground">UTC{tz.offset}</span>
                      )}
                    </div>
                    {timezone === tz.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                ))}
                {filteredTzs.length === 0 && (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center">No timezones found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* AI Chat shortcut */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            title="AI Trading Assistant"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-warning animate-pulse-soft" />
        </button>

        {/* Upgrade */}
        {onShowPlans && (
          <button
            onClick={onShowPlans}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-warning/15 to-primary/15 border border-warning/30 text-sm font-medium hover:border-warning/50 transition-colors"
          >
            <Crown className="w-4 h-4 text-warning" />
            <span className="hidden lg:inline">Upgrade</span>
          </button>
        )}

        {/* New Trade */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Trade</span>
          </button>
        )}
      </div>
    </header>
  );
}
