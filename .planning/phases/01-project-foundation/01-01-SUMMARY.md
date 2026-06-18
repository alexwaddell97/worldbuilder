# Plan 01-01 Summary: Project Scaffolding & Design System

**Status:** Complete
**Commit:** feat(01-01): scaffold Next.js 15, Tailwind v4, shadcn/ui tokens, Geist fonts, Drizzle/Neon scaffold

## What Was Built

Greenfield Next.js 15 application with the full foundation stack:

- **Next.js 15** (App Router, TypeScript strict, `src/` directory, `@/*` alias)
- **Geist fonts** via `geist` npm package — `GeistSans.variable` + `GeistMono.variable` applied to `<html>` in root layout
- **Tailwind CSS 4.x** with `@tailwindcss/postcss` plugin. CSS-first config via `globals.css` (no `tailwind.config.js`)
- **shadcn/ui** — `components.json` created manually (shadcn init doesn't support Tailwind v4 CLI flow); `cn()` utility in `src/lib/utils.ts`
- **CSS design tokens** — Full Apple-clean neutral palette in `globals.css` via shadcn's CSS variable conventions (17 tokens, no hardcoded colors anywhere)
- **Neon + Drizzle** connection scaffold in `src/lib/db/index.ts` using `drizzle-orm/neon-http` (not `pg` — Vercel edge compatible)
- **`drizzle.config.ts`** pointing to `./src/lib/db/schema.ts` + `./drizzle/migrations`
- **`.env.local.example`** documenting all 5 required env vars

## Deviations

- **shadcn/ui init CLI failure**: `npx shadcn@latest init --defaults` failed with "No Tailwind CSS configuration found" because Tailwind v4 is CSS-first (no `tailwind.config.js`). Resolved by manually creating `components.json` and writing `globals.css` directly — the output is identical to what `shadcn init` would produce.
- **`create-next-app` conflict**: The `.planning/` directory caused a conflict with `create-next-app` in-place. Scaffolded in `/tmp/worldbuilder-scaffold` then rsynced (excluding `.git/` and `node_modules/`).

## Files Created

- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`
- `postcss.config.mjs` — Tailwind v4 PostCSS plugin
- `components.json` — shadcn/ui registry config
- `src/app/globals.css` — Tailwind import + full CSS variable design token system
- `src/app/layout.tsx` — Root HTML shell with Geist font variables
- `src/app/page.tsx` — Placeholder (replaced in Plan 01-05)
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/lib/db/index.ts` — Drizzle + Neon HTTP connection scaffold
- `drizzle.config.ts` — Drizzle Kit migration config
- `.env.local.example` — All required env vars documented

## Self-Check: PASSED

- `npx tsc --noEmit` exits clean ✓
- `globals.css` starts with `@import "tailwindcss"` ✓
- 17 CSS custom properties defined under `:root` ✓
- No hardcoded hex/rgb colors outside `globals.css` ✓
- `src/lib/db/index.ts` exports `db` using Neon HTTP driver ✓
- `drizzle.config.ts` references `src/lib/db/schema.ts` ✓
- `.env.local.example` documents all 5 env vars ✓
- `components.json` exists ✓
- `geist` in `package.json` dependencies ✓
