# TraderOS Project Structure

## Overview

This repository is organized around a layered architecture so new developers can understand responsibilities quickly.

## Top-Level Structure

- `src/app` — application-level composition and bootstrap logic
- `src/components` — UI building blocks and feature panels
- `src/features` — business/domain features such as trading logic and hooks
- `src/lib` — domain services and data access helpers
- `src/shared` — reusable utilities and generic app primitives
- `src/index.css` — global styles and theme setup

## Directory Guidance

### App layer
- Contains the root application shell and provider composition.
- Used for route-level or page-level integration only.

### Features layer
- Organizes domain functionality into isolated modules.
- Keeps business logic grouped by domain, such as trading metrics or strategy analysis.

### Shared layer
- Holds reusable helpers and formatting functions.
- Should not contain app-specific business logic.

### Components layer
- Contains presentational UI and feature-specific panels.
- Prefer composition over duplication.

## Conventions

- Keep feature logic in `src/features`
- Keep reusable helpers in `src/shared`
- Avoid scattering business logic across the root app shell
- Prefer typed interfaces and stable module boundaries
