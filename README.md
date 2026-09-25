# TraderOS

A structured trading workspace and AI-assisted market dashboard.

## Project structure

- `src/app` — application bootstrap and app-level composition
- `src/components` — UI blocks and feature screens
- `src/features` — logic grouped by feature/domain
- `src/lib` — API and data-layer integration utilities
- `src/shared` — shared helpers and generic utilities
- `docs` — architecture and onboarding notes

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

This project expects a Supabase backend with the necessary environment variables configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
