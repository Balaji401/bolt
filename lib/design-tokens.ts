/**
 * TraderOS Design Tokens
 * Single source of truth for spacing, radius, shadows, motion, and layout.
 * Colors are defined as CSS variables in app/globals.css and mapped in tailwind.config.ts.
 */

export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',  // 48px
  '4xl': '4rem',  // 64px
} as const;

export const radius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 hsl(var(--foreground) / 0.05)',
  md: '0 4px 6px -1px hsl(var(--foreground) / 0.08), 0 2px 4px -2px hsl(var(--foreground) / 0.05)',
  lg: '0 10px 15px -3px hsl(var(--foreground) / 0.10), 0 4px 6px -4px hsl(var(--foreground) / 0.05)',
  xl: '0 20px 25px -5px hsl(var(--foreground) / 0.12), 0 8px 10px -6px hsl(var(--foreground) / 0.05)',
  glow: '0 0 20px hsl(var(--primary) / 0.25)',
} as const;

export const motion = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export const layout = {
  sidebarWidth: '16rem',     // 256px
  topbarHeight: '4rem',      // 64px
  mobileNavHeight: '3.5rem', // 56px
  maxWidth: '80rem',         // 1280px
  pagePadding: {
    mobile: '1rem',
    desktop: '2rem',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const;

export const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

export const zIndices = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  sidebar: 30,
  topbar: 30,
  mobileNav: 40,
  overlay: 50,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadows;
