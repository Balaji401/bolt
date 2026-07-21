/**
 * TraderOS Brand Configuration
 * Centralized brand identity — change here, not in components.
 */

export const brand = {
  name: 'TraderOS',
  tagline: 'The Operating System for Traders',
  subtitle: 'Operating System',
  description:
    'TraderOS is the complete operating system for traders. Plan, execute, journal, analyze, and improve — all in one intelligent ecosystem.',
  url: 'https://traderos.app',
  logo: {
    icon: 'TrendingUp', // lucide-react icon name
    gradient: 'from-primary to-success',
  },
  colors: {
    primary: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    destructive: 'hsl(var(--destructive))',
  },
  social: {
    ogImage: 'https://traderos.app/og.png',
  },
  copyright: '© 2026 TraderOS — The operating system for traders.',
} as const;

export type Brand = typeof brand;
