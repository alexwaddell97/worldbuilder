---
phase: 02-world-management
plan: 04
subsystem: ui
tags: [react, nextjs, routing, middleware, server-actions, drizzle]

requires:
  - phase: 02-03
    provides: EditWorldDialog, DeleteWorldDialog (reused on detail page)
  - phase: 02-01
    provides: getWorldBySlug

provides:
  - proxy.ts extended to protect /worlds paths (unauthenticated redirect to /login)
  - /worlds/[slug]/layout.tsx (owner-scoped fetch, notFound on miss, Sidebar shell)
  - /worlds/[slug]/page.tsx (RSC detail shell: breadcrumb, name, actions, metadata, separator, Phase 3 placeholder)
  - /worlds/[slug]/world-detail-actions.tsx (client island owning Edit/Delete open state)
  - sidebar.tsx extended with world-context header + Entities (Phase 3) placeholder

affects: [03-entity-types, all phases that extend /worlds/[slug]]

tech-stack:
  added: []
  patterns: [route group (worlds) mirrors (app) shell pattern, client island on RSC page, notFound-not-403 for IDOR prevention]

key-files:
  created:
    - src/app/(worlds)/worlds/[slug]/layout.tsx
    - src/app/(worlds)/worlds/[slug]/page.tsx
    - src/app/(worlds)/worlds/[slug]/world-detail-actions.tsx
  modified:
    - src/proxy.ts
    - src/components/layout/sidebar.tsx

key-decisions:
  - "notFound() (404) not redirect/403 on non-owned slug — prevents slug enumeration (T-02-10)"
  - "Layout re-fetches world for ownership check; page also fetches for defense in depth"
  - "force-dynamic on detail page — matches dashboard posture, reflects edit/delete immediately"
  - "Sidebar reads worldSlug from pathname.match() — avoids context/prop-drilling; uses slug as label (client component has no world record)"
  - "Client island (world-detail-actions.tsx) owns dialog open state so page.tsx stays RSC"

patterns-established:
  - "Route group (worlds) reproduces the (app) Sidebar shell for world-scoped routes"
  - "Layout + page double-guard: layout fetches for ownership, page fetches again for defense in depth"
  - "IIFE in sidebar JSX for conditional world-context block — avoids extracting a separate component"

requirements-completed: [UAT-6]

duration: 15min
completed: 2026-06-24
---

# Plan 02-04 Summary

**World-scoped routing complete: /worlds/[slug] is auth-protected, owner-scoped (404 on miss), and renders detail shell with sidebar world context.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-06-24
- **Tasks:** 3 (+ human checkpoint pending)
- **Files modified:** 5

## Accomplishments

- `proxy.ts` now redirects unauthenticated requests for `/worlds/*` to `/login` via `pathname.startsWith("/worlds")` — satisfies UAT-6
- Matcher confirmed as broad negative-lookahead `(?!...).*` — no restrictive allowlist, /worlds is covered without matcher edits
- `/worlds/[slug]/layout.tsx`: `await params` (Next.js 16), session guard → redirect, `getWorldBySlug` + `notFound()` on null (404, not 403, prevents slug enumeration T-02-10), renders Sidebar + main shell
- `/worlds/[slug]/page.tsx`: RSC, `force-dynamic`, breadcrumb link to /dashboard, world name heading, `WorldDetailActions` client island, description, privacy Badge + `font-mono` slug, Separator, "Entities and content coming in Phase 3."
- `world-detail-actions.tsx`: `"use client"` island, manages editOpen/deleteOpen, composes `EditWorldDialog`/`DeleteWorldDialog` from 02-03
- Sidebar extended: `pathname.match(/^\/worlds\/([^/]+)/)` detects world context; when expanded shows world slug as contextual header + "Entities (Phase 3)" placeholder; hidden when collapsed or outside /worlds paths
- All 11 artifact checks green; `npm run build` passes with `/worlds/[slug]` in route table
