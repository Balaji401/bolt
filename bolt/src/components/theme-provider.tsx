'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { emit } from '@/lib/event-bus';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

const ThemeContext = createContext<{ theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (t: Theme) => void; toggle: () => void }>({
  theme: 'dark', resolvedTheme: 'dark', setTheme: () => {}, toggle: () => {},
});

const STORAGE_KEY = 'traderos-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'light');
  html.classList.add(resolved);
  html.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored || 'dark';
    setThemeState(initial);
    const resolved = initial === 'system' ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { const r = getSystemTheme(); setResolvedTheme(r); applyTheme(r); emit('theme:changed', r); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    const resolved = t === 'system' ? getSystemTheme() : t;
    setResolvedTheme(resolved);
    applyTheme(resolved);
    emit('theme:changed', resolved);
  }, []);

  const toggle = useCallback(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'), [resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
