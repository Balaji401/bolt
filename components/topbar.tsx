'use client';

import { Search, Bell, Plus, Crown, Sun, Moon, MessageSquare } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

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
  const { theme, toggle } = useTheme();

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

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
