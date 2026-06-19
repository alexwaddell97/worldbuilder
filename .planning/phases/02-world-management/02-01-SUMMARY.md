---
phase: 02-world-management
plan: "01"
subsystem: data-layer
tags: [schema, drizzle, server-actions, zod, idor, auth]
dependency_graph:
  requires:
    - 01-project-foundation (worlds table, Drizzle config, Better Auth session)
  provides:
    - worlds table with composite (owner_id, slug) UNIQUE constraint (live on Neon)
    - Zod v4 validation schemas: CreateWorldSchema, UpdateWorldSchema, WorldActionState
    - Owner-scoped read helpers: getWorldsByOwner, getWorldBySlug
    - Four Server Actions: createWorldAction, updateWorldAction, deleteWorldAction, togglePrivacyAction
  affects:
    - 02-02 (dashboard page — consumes getWorldsByOwner + createWorldAction)
    - 02-03 (world detail page — consumes getWorldBySlug + updateWorldAction)
    - 02-04 (world layout — consumes getWorldBySlug for auth guard)
tech_stack:
  added:
    - zod@4.4.3 (Zod v4 validation — { error: } syntax)
    - slugify@1.6.9 (URL-safe slug generation from world name)
    - "@radix-ui/react-dialog@1.1.17" (shadcn Dialog dependency — Phase 2 UI plans)
    - "@radix-ui/react-alert-dialog@1.1.17" (shadcn AlertDialog dependency — Phase 2 UI plans)
  patterns:
    - Next.js 16 Server Actions with "use server" directive
    - Zod v4 safeParse + flatten().fieldErrors for useActionState integration
    - IDOR protection via AND(eq(worlds.id), eq(worlds.ownerId)) on all mutations
    - updateTag (not revalidateTag) for Next.js 16 cache invalidation
    - force-dynamic consumer posture (no cacheTag on query helpers)
key_files:
  created:
    - src/lib/validations/worlds.ts
    - src/lib/db/queries/worlds.ts
    - src/lib/actions/worlds.ts
    - drizzle/migrations/0002_dazzling_piledriver.sql
    - drizzle/migrations/meta/0002_snapshot.json
  modified:
    - src/lib/db/schema.ts (worlds table: removed .unique() on slug, added table-level composite unique)
    - drizzle/migrations/meta/_journal.json
    - package.json (added zod, slugify, @radix-ui/react-dialog, @radix-ui/react-alert-dialog)
decisions:
  - "updateTag over revalidateTag: Next.js 16 requires cacheLife profile on revalidateTag; updateTag provides read-your-writes for CRUD dashboards"
  - "No cacheTag on query helpers: consuming pages export dynamic='force-dynamic' (Phase 2 posture); updateTag calls are defensive hooks for future 'use cache' adoption"
  - "IDOR via AND(id, ownerId): non-owner worldId silently matches zero rows — prevents cross-user tampering without leaking existence"
  - "404-not-403 for world not found: layout uses notFound() to prevent world existence enumeration (IDOR information disclosure)"
  - "Slug not regenerated on edit: URL stability after creation — slug is immutable after createWorldAction generates it"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-19"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 3
---

# Phase 02 Plan 01: World CRUD Data Foundation Summary

**One-liner:** Per-user composite slug constraint migrated to Neon, Zod v4 schemas defined, owner-scoped Drizzle read helpers and four IDOR-safe Server Actions implemented with auth guards and Next.js 16 updateTag cache invalidation.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Migrate worlds.slug to composite (owner_id, slug) unique | 59bc6b2 | src/lib/db/schema.ts, drizzle/migrations/0002_dazzling_piledriver.sql |
| 2 | Zod validation schemas and owner-scoped query helpers | a8705b7 | src/lib/validations/worlds.ts, src/lib/db/queries/worlds.ts |
| 3 | Server Actions with auth + IDOR guards | cf8afdf | src/lib/actions/worlds.ts |

## What Was Built

### Task 1: Schema Migration (Blocking)

Modified `src/lib/db/schema.ts` to convert the `worlds` table from a single-argument form (with `.unique()` on the slug column) to a two-argument form with a table-level composite unique constraint named `worlds_owner_id_slug_unique` on `(owner_id, slug)`. This mirrors the existing `entityTypes` `worldSlugUnique` pattern.

Generated migration `0002_dazzling_piledriver.sql`:
```sql
ALTER TABLE "worlds" DROP CONSTRAINT "worlds_slug_unique";
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_owner_id_slug_unique" UNIQUE("owner_id","slug");
```

**drizzle-kit migrate stdout (exit 0 — confirmed applied to Neon):**
```
Reading config file '...drizzle.config.ts'
Using '@neondatabase/serverless' driver for database querying
[checkmark] migrations applied successfully!
EXIT_CODE: 0
```

**Pending manual verification (UAT-5):** The live per-user-uniqueness proof is the two-user manual test in `02-VALIDATION.md` (Manual-Only Verifications): two users each create a world named "Test" — both succeed with slug `test`; same user's second "Test" yields `test-2`. This must be run at phase end.

### Task 2: Validation Schemas and Query Helpers

`src/lib/validations/worlds.ts`:
- `CreateWorldSchema` and `UpdateWorldSchema`: Zod v4 with `{ error: }` syntax (not `{ message: }`)
- `WorldActionState` type compatible with `useActionState`
- Inferred `CreateWorldInput` and `UpdateWorldInput` types

`src/lib/db/queries/worlds.ts`:
- `getWorldsByOwner(ownerId)`: owner-scoped, ordered by `desc(updatedAt)`
- `getWorldBySlug(slug, ownerId)`: AND-scoped on both slug and ownerId (IDOR-safe)
- No `cacheTag`/`'use cache'` — comment documents force-dynamic consumer posture (RESEARCH Pitfall 5)

### Task 3: Server Actions

`src/lib/actions/worlds.ts` (`"use server"`):
- `createWorldAction`: session guard, Zod validation, `generateUniqueSlug` (owner-scoped, -2/-3/... suffixes), `db.insert`, `updateTag`, `revalidatePath`, `redirect`
- `updateWorldAction(worldId, prevState, formData)`: IDOR-safe update (AND id + ownerId), slug immutable, returns `{ message: "saved" }` (no redirect)
- `deleteWorldAction(worldId)`: IDOR-safe delete, redirects to `/dashboard`
- `togglePrivacyAction(worldId)`: owner-scoped read -> toggle -> IDOR-safe update, dual `updateTag` calls
- All actions: `auth.api.getSession` at top, `session.user.id` only source of ownerId
- `updateTag` used (not `revalidateTag`) — Next.js 16 breaking change compliance

## Deviations from Plan

### Auto-added Items

**[Rule 2 - Missing Critical] Added required packages to worktree package.json**
- **Found during:** Task 1 setup
- **Issue:** RESEARCH.md noted packages were "installed during research" but they were absent from the worktree's `package.json` (worktree branched before those unstaged edits in the main repo)
- **Fix:** Added `zod@^4.4.3`, `slugify@^1.6.9`, `@radix-ui/react-dialog@^1.1.17`, `@radix-ui/react-alert-dialog@^1.1.17` to `package.json`. Packages already exist in shared `node_modules/` (main repo had `npm install` run); this records them formally so the lock file stays accurate.
- **Files modified:** package.json
- **Commit:** 59bc6b2

## Migration Applied — Verification Record

| Check | Result |
|-------|--------|
| `drizzle-kit generate` exit code | 0 |
| `drizzle-kit migrate` exit code | 0 |
| Migration SQL: DROP CONSTRAINT "worlds_slug_unique" | Present |
| Migration SQL: ADD CONSTRAINT "worlds_owner_id_slug_unique" | Present |
| TypeScript (npx tsc --noEmit) | Exit 0 |
| Live Neon constraint confirmed? | Pending — UAT-5 two-user manual test (02-VALIDATION.md) |

## Security Review

All STRIDE threats from the plan's threat model are mitigated:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-02-01 IDOR on update/delete/toggle | `and(eq(worlds.id), eq(worlds.ownerId))` on every mutation | Implemented — 5 occurrences |
| T-02-02 Spoofing ownerId | Only `session.user.id` used; no client-passed ownerId | Implemented |
| T-02-03 FormData mass assignment | Zod allowlist: name + description only; isPublic/slug/ownerId set server-side | Implemented |
| T-02-04 Slug injection | `slugify(name, { strict: true })` strips unsafe chars + DB composite constraint | Implemented |
| T-02-05 Unauthenticated invocation | Session verified at top of all 4 actions | Implemented — 4x auth.api.getSession |

## Known Stubs

None — this plan is data-layer only. No UI rendering, no stub values.

## Self-Check: PASSED

- [x] src/lib/db/schema.ts — exists, contains worlds_owner_id_slug_unique
- [x] drizzle/migrations/0002_dazzling_piledriver.sql — exists, DROP+ADD constraints present
- [x] src/lib/validations/worlds.ts — exists, exports CreateWorldSchema, UpdateWorldSchema, WorldActionState
- [x] src/lib/db/queries/worlds.ts — exists, exports getWorldsByOwner, getWorldBySlug
- [x] src/lib/actions/worlds.ts — exists, exports all 4 actions
- [x] Commit 59bc6b2 — feat(02-01): migrate worlds.slug
- [x] Commit a8705b7 — feat(02-01): Zod schemas and query helpers
- [x] Commit cf8afdf — feat(02-01): Server Actions
- [x] npx tsc --noEmit exits 0
