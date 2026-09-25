# TraderOS

TraderOS is a forex trading journal, analytics, psychology, and performance dashboard for traders and prop-firm challenge participants.

## What this project includes

- Frontend app in `bolt/` with React, Vite, TypeScript, Tailwind, and shadcn/ui
- Supabase-powered data layer for trading journals, risk, accounts, and AI modules
- Python trading-agent utilities in `src/`
- Project docs and migration files under `bolt/docs` and `supabase/`

## Run the frontend

```bash
cd bolt
npm install
npm run dev
```

## Build the frontend

```bash
cd bolt
npm run build
```

## Notes

This project is intended for journaling, analytics, and psychology tracking. It does not include automated market execution or strategy signal generation.
