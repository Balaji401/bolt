'use client';

import { Search, Bell, Plus, Menu } from 'lucide-react';

export function Topbar({ title, subtitle, onAdd }: { title: string; subtitle?: string; onAdd?: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="h-full px-4 lg:px-8 flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-lg hover:bg-secondary">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border w-72">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search trades, instruments..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-secondary">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning animate-pulse-soft" />
        </button>
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
