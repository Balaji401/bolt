export const spacing = { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '2.5rem', '3xl': '3rem', '4xl': '4rem' } as const;
export const radius = { none: '0', sm: 'calc(var(--radius) - 4px)', md: 'calc(var(--radius) - 2px)', lg: 'var(--radius)', xl: 'calc(var(--radius) + 4px)', '2xl': 'calc(var(--radius) + 8px)', full: '9999px' } as const;
export const shadows = {
  sm: '0 1px 2px 0 hsl(var(--foreground) / 0.05)',
  md: '0 4px 6px -1px hsl(var(--foreground) / 0.08), 0 2px 4px -2px hsl(var(--foreground) / 0.05)',
  lg: '0 10px 15px -3px hsl(var(--foreground) / 0.10), 0 4px 6px -4px hsl(var(--foreground) / 0.05)',
  xl: '0 20px 25px -5px hsl(var(--foreground) / 0.12), 0 8px 10px -6px hsl(var(--foreground) / 0.05)',
  glow: '0 0 20px hsl(var(--primary) / 0.25)',
} as const;
export const motion = {
  duration: { fast: '150ms', normal: '200ms', slow: '300ms', slower: '400ms' },
  easing: { ease: 'cubic-bezier(0.4,0,0.2,1)', easeIn: 'cubic-bezier(0.4,0,1,1)', easeOut: 'cubic-bezier(0,0,0.2,1)', easeInOut: 'cubic-bezier(0.4,0,0.2,1)', spring: 'cubic-bezier(0.34,1.56,0.64,1)' },
} as const;
export const layout = { sidebarWidth: '16rem', topbarHeight: '4rem', mobileNavHeight: '3.5rem', maxWidth: '80rem', pagePadding: { mobile: '1rem', desktop: '2rem' } } as const;
export const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'] as const;
export const zIndices = { base: 0, dropdown: 10, sticky: 20, sidebar: 30, topbar: 30, mobileNav: 40, overlay: 50, modal: 50, toast: 60, tooltip: 70 } as const;
