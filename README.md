# TraderOS

TraderOS is a forex trading journal, analytics, psychology, and performance dashboard for traders and prop-firm challenge participants.

## What this project includes

- React, Vite, TypeScript, Tailwind, and shadcn/ui frontend at the repository root
- Supabase-powered data layer for trading journals, risk, accounts, and AI modules
- Project documentation under `docs/`
- Database migrations and Edge Functions under `supabase/`

## Run the app

From the repository root:

```bash
npm install
npm run dev
```

## Build the app

From the repository root:

```bash
npm run build
```

## Environment setup

Copy `.env.example` to `.env` and fill in the two Supabase settings for the project.

## Notes

This project is intended for journaling, analytics, and psychology tracking. It does not include automated market execution or strategy signal generation.
