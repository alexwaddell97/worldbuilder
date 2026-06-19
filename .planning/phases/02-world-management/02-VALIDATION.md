---
phase: 2
slug: world-management
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (no unit-test runner installed; type-check + build serve as the automated gates) |
| **Config file** | none — `tsconfig.json` (type check) and `next.config.ts` (build) already present |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~2s (tsc) / ~30-60s (build) |

> Rationale: this project has no test runner (jest/vitest/etc.) installed. The
> Nyquist-compliant automated signal for every task is the TypeScript compiler
> (`npx tsc --noEmit`) — it catches contract drift, missing exports, and the
> Next.js 16 async-API / `revalidateTag` breaking changes — plus `npm run build`
> for the route-producing tasks (App Router page/layout compilation). Behavioral
> assertions that require a running browser + Neon database are captured in the
> Manual-Only Verifications table below.

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** `npm run build` must exit 0
- **Max feedback latency:** ~2s (tsc), ~60s (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | UAT-5 | T-02-04 | Composite `UNIQUE(owner_id, slug)` enforces per-user uniqueness at DB layer; global slug unique dropped | static (schema+migration) | `grep -q 'worlds_owner_id_slug_unique' src/lib/db/schema.ts && ! grep -E 'slug.*\.unique\(\)' src/lib/db/schema.ts && grep -rq 'worlds_owner_id_slug_unique' drizzle/migrations/ && grep -rq 'DROP CONSTRAINT' drizzle/migrations/ && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | UAT-1, UAT-3 | T-02-03 | Zod allowlist (`name`, `description` only); owner-scoped read helpers (no slug-only query) | static | `grep -q 'error:' src/lib/validations/worlds.ts && ! grep -q 'message:' src/lib/validations/worlds.ts && grep -q 'WorldActionState' src/lib/validations/worlds.ts && grep -q 'getWorldsByOwner' src/lib/db/queries/worlds.ts && grep -q 'eq(worlds.ownerId' src/lib/db/queries/worlds.ts && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-01-03 | 01 | 1 | UAT-1, UAT-3, UAT-4 | T-02-01 / T-02-02 / T-02-05 | Session verified per action; mutations scoped by `ownerId` (IDOR-safe); no single-arg `revalidateTag` | static | `grep -q '"use server"' src/lib/actions/worlds.ts; grep -q 'auth.api.getSession' src/lib/actions/worlds.ts && [ "$(grep -c 'eq(worlds.ownerId' src/lib/actions/worlds.ts)" -ge 3 ] && ! grep -E 'revalidateTag\(' src/lib/actions/worlds.ts && grep -q 'createWorldAction' src/lib/actions/worlds.ts && grep -q 'togglePrivacyAction' src/lib/actions/worlds.ts && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 1 | UAT-1..4 | T-02-06 / T-02-SC | Official shadcn registry only; no third-party registry | static (file presence + deps) | `for f in card dialog alert-dialog textarea badge dropdown-menu separator switch; do test -f "src/components/ui/$f.tsx" || exit 1; done; grep -lq 'from "@/lib/utils"' src/components/ui/card.tsx && grep -q '@radix-ui/react-switch' package.json && grep -q '@radix-ui/react-dropdown-menu' package.json && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-03-01 | 03 | 2 | UAT-1, UAT-3 | — | Form is allowlist-bound to actions; inline Zod errors surfaced | static | `grep -q 'useActionState' src/components/worlds/world-form.tsx && grep -q 'createWorldAction' src/components/worlds/create-world-dialog.tsx && grep -q 'updateWorldAction' src/components/worlds/edit-world-dialog.tsx && grep -q 'aria-describedby' src/components/worlds/world-form.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-03-02 | 03 | 2 | UAT-2, UAT-4 | T-02-01 / T-02-08 | Cards render only owner-scoped worlds; delete/toggle re-verified server-side | static | `grep -q 'useOptimistic' src/components/worlds/privacy-toggle.tsx && grep -q 'deleteWorldAction' src/components/worlds/delete-world-dialog.tsx && grep -q 'DropdownMenu' src/components/worlds/world-card.tsx && grep -q 'aria-label="Toggle world privacy"' src/components/worlds/privacy-toggle.tsx && grep -q 'line-clamp-2' src/components/worlds/world-card.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-03-03 | 03 | 2 | UAT-2 | T-02-08 | `getWorldsByOwner(session.user.id)` owner-scoped; `force-dynamic` keeps list fresh after mutation | build | `grep -q 'getWorldsByOwner' "src/app/(app)/dashboard/page.tsx" && grep -q 'CreateWorldDialog' "src/app/(app)/dashboard/page.tsx" && grep -q 'WorldCard' "src/app/(app)/dashboard/page.tsx" && grep -q 'No worlds yet' "src/app/(app)/dashboard/page.tsx" && grep -q "force-dynamic" "src/app/(app)/dashboard/page.tsx" && ! grep -q 'comes in Phase 2' "src/app/(app)/dashboard/page.tsx" && npm run build` | ✅ | ⬜ pending |
| 2-04-01 | 04 | 3 | UAT-6 | T-02-09 / T-02-10 / T-02-11 | proxy redirects `/worlds` when unauthenticated; matcher not path-restricted; layout 404 (not 403) on non-owned world | static | `grep -q '/worlds' src/proxy.ts && grep -q 'startsWith("/worlds")' src/proxy.ts && grep -Eq 'matcher.*\(\?!' src/proxy.ts && ! grep -Eq 'matcher.*\[.*"/dashboard"' src/proxy.ts && grep -q 'await params' "src/app/(worlds)/worlds/[slug]/layout.tsx" && grep -q 'notFound' "src/app/(worlds)/worlds/[slug]/layout.tsx" && grep -q 'getWorldBySlug' "src/app/(worlds)/worlds/[slug]/layout.tsx" && ! grep -E 'params\.slug' "src/app/(worlds)/worlds/[slug]/layout.tsx" && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-04-02 | 04 | 3 | UAT-6 | T-02-11 | Page re-fetches owner-scoped + `notFound()` (defense in depth); actions island stays client-only | build | `grep -q 'await params' "src/app/(worlds)/worlds/[slug]/page.tsx" && grep -q 'getWorldBySlug' "src/app/(worlds)/worlds/[slug]/page.tsx" && grep -q 'coming in Phase 3' "src/app/(worlds)/worlds/[slug]/page.tsx" && grep -q 'Your Worlds' "src/app/(worlds)/worlds/[slug]/page.tsx" && test -f "src/app/(worlds)/worlds/[slug]/world-detail-actions.tsx" && npm run build` | ✅ | ⬜ pending |
| 2-04-03 | 04 | 3 | UI-SPEC §7 | — | Sidebar shows world-context header + "Entities (Phase 3)" placeholder when inside `/worlds/[slug]` | static | `grep -q 'Entities (Phase 3)' src/components/layout/sidebar.tsx && grep -q '/worlds/' src/components/layout/sidebar.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test runner exists or is being added in this phase; `npx tsc --noEmit` and `npm run build` are the automated gates and require no scaffolding. No `MISSING` automated references appear in any plan.

---

## Manual-Only Verifications

These behaviors require a running browser session and a live Neon database; they cannot be asserted by `tsc`/`build` alone. All are confirmed at the blocking human-verify checkpoints in 02-03 (Task 4) and 02-04 (Task 3), plus the migration-applied step in 02-01.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create a world with name + auto-slug, see it appear | UAT-1 | Needs browser form submit + DB insert + redirect | 02-03 Task 4 step 3: open Create dialog, enter a name, submit, confirm world appears on /dashboard and redirect to `/worlds/{slug}` |
| Dashboard lists all of the signed-in user's worlds | UAT-2 | Needs authenticated session + DB read render | 02-03 Task 4 step 5: confirm each owned world renders as a card with name, slug, privacy badge |
| Edit a world's name/description | UAT-3 | Needs browser dialog + DB update + re-render | 02-03 Task 4 step 6: card menu → Edit → change name → Save → confirm card updates |
| Delete a world with confirmation | UAT-4 | Needs AlertDialog interaction + DB delete | 02-03 Task 4 step 8: card menu → Delete → confirm AlertDialog shows world name → "Delete world" → confirm card disappears |
| Slug is unique **per user**, not globally | UAT-5 | Requires the migration to have actually been applied to Neon and two distinct user accounts to exercise the composite constraint — a source grep cannot confirm DB state | (a) 02-01 Task 1: confirm `npx drizzle-kit migrate` exited 0 against Neon (migration applied; if `DATABASE_URL` unset the executor must STOP, not fabricate success). (b) Two-user test: sign in as user A, create a world named "Test" (slug `test`); sign out; sign in as user B, create a world named "Test" → both succeed with slug `test`. (c) Same-user test: as user B, create a second "Test" → slug auto-increments to `test-2` (no constraint error surfaced to the user) |
| Private world not accessible to unauthenticated users | UAT-6 | Requires incognito/signed-out browser + proxy redirect + 404 path | 02-04 Task 3 step 4 (owner-scope 404 on a non-owned/nonexistent slug) and step 5 (incognito → `/worlds/anything` redirects to `/login`) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task carries a `tsc`/`build` gate)
- [x] Wave 0 covers all MISSING references (none exist)
- [x] No watch-mode flags
- [x] Feedback latency < 2s for tsc gate (build gate ~60s on route tasks only)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-19
