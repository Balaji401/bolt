# TraderOS Design System

## Colors

Defined as CSS variables in `app/globals.css`, mapped in `tailwind.config.ts`.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--background` | 222 22% 7% | 210 30% 98% | Page background |
| `--foreground` | 210 20% 96% | 222 22% 10% | Primary text |
| `--card` | 222 18% 10% | 0 0% 100% | Card surfaces |
| `--primary` | 199 89% 56% | 199 89% 42% | Brand blue |
| `--secondary` | 222 16% 14% | 210 20% 94% | Muted surfaces |
| `--muted-foreground` | 215 16% 65% | 215 16% 45% | Secondary text |
| `--success` | 152 65% 48% | 152 65% 38% | Positive states |
| `--warning` | 38 92% 55% | 38 92% 45% | Caution states |
| `--destructive` | 0 72% 56% | 0 72% 50% | Error states |
| `--border` | 222 14% 18% | 210 20% 85% | Borders |

Chart palette: `--chart-1` through `--chart-5` (blue, green, amber, violet, red).

## Typography

- **Font**: Inter (via `next/font/google`, `--font-inter` variable)
- **Scale**: 12px → 48px (`xs` → `5xl`) — see `lib/design-tokens.ts`
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Line height**: 1.2 (headings), 1.5 (body), 1.625 (relaxed)

## Spacing

8px base system. Tokens: `xs` (8px), `sm` (12px), `md` (16px), `lg` (24px), `xl` (32px), `2xl` (40px), `3xl` (48px), `4xl` (64px).

## Border Radius

`--radius` = 0.75rem (12px). Scale: `sm`, `md`, `lg`, `xl`, `2xl`, `full`.

## Shadows

Five elevation levels: `sm`, `md`, `lg`, `xl`, `glow`. Defined in `lib/design-tokens.ts`.

## Motion

| Duration | Value |
|---|---|
| fast | 150ms |
| normal | 200ms |
| slow | 300ms |
| slower | 400ms |

Easing: `ease`, `easeIn`, `easeOut`, `easeInOut`, `spring`.

## Glass Effect

`.glass` and `.glass-strong` utilities provide backdrop-blur surfaces with semi-transparent backgrounds. Theme-aware via `.light` overrides.

## Theme Engine

`ThemeProvider` supports `dark`, `light`, `system` modes. SSR-safe with `suppressHydrationWarning` on `<html>`. Emits `theme:changed` events via the Event Bus.
