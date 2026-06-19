# Phase 2: World Management - Research

**Researched:** 2026-06-19
**Domain:** Next.js 16 App Router CRUD — Server Actions, Drizzle ORM, shadcn/ui, slug management
**Confidence:** HIGH

---

## Summary

Phase 2 delivers world CRUD (create, edit, delete, list) and world-scoped routing for the Odin's Archive platform. The foundation from Phase 1 is solid: the `worlds` table exists with the correct columns, Drizzle ORM is configured with the Neon HTTP driver, Better Auth sessions are available on the server, and the `(app)` route group provides the authenticated layout shell.

One critical schema migration is required before any CRUD work begins: the current `worlds.slug` column is globally unique (`UNIQUE(slug)`), but the Phase 2 UAT specifies uniqueness per user account (`UNIQUE(owner_id, slug)`). This constraint must be changed in a new Drizzle migration at the start of Phase 2. This is a straightforward `ALTER TABLE` — drop the old constraint, add the composite one.

The correct mutation pattern for this stack is **Server Actions** (not Route Handlers). Server Actions integrate natively with `useActionState` for inline form error display, `useOptimistic` for instant UI feedback, and `revalidatePath` / `updateTag` for cache invalidation. All four CRUD operations (create world, update world, toggle privacy, delete world) should be implemented as `'use server'` functions in a dedicated `src/lib/actions/worlds.ts` module.

**Primary recommendation:** Server Actions with Zod v4 validation, Drizzle ORM mutations, and `updateTag` (not `revalidateTag`) for instant read-your-writes cache consistency on the dashboard.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| World list (dashboard) | API / Backend (RSC) | — | Auth-gated, user-scoped query — belongs in Server Component |
| World CRUD mutations | API / Backend (Server Action) | — | Database writes need server-side auth verification |
| Form UI (create/edit) | Browser / Client | Frontend Server (RSC wrapper) | Form state (`useActionState`) requires `'use client'`; page wrapper stays RSC |
| Delete confirmation dialog | Browser / Client | — | Dialog open/close state is local client state |
| Privacy toggle | API / Backend (Server Action) | Browser / Client (optimistic) | Toggle fires Server Action; optimistic update via `useOptimistic` |
| World-scoped routing | Frontend Server (Next.js) | — | `[slug]` dynamic segment resolved at request time |
| Slug generation | API / Backend (Server Action) | — | Must query DB for uniqueness before writing; server-only |
| Auth guard on `/worlds/[slug]` | Frontend Server (proxy.ts) | RSC layout | proxy.ts for redirect; layout for belt-and-suspenders |

---

## Standard Stack

### Core (already installed in Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.9 | App Router, Server Actions, dynamic routing | Already installed — project foundation |
| Drizzle ORM | 0.45.2 | Database queries and mutations | Already installed — project foundation |
| Better Auth | 1.6.19 | Session retrieval in Server Actions | Already installed — project foundation |
| Zustand | 5.0.14 | Client-side UI state (dialogs, pending) | Already installed — project foundation |
| lucide-react | 1.21.0 | Icons (Globe, Lock, Plus, Pencil, Trash2, MoreHorizontal) | Already installed — all needed icons confirmed present |

### New Packages for Phase 2

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.4.3 | Server Action input validation | [VERIFIED: npm registry] — TypeScript-first, used throughout Next.js official docs |
| slugify | 1.6.9 | Generate URL-safe slug from world name | [VERIFIED: npm registry] — simple, zero-dep, confirmed API works |
| @radix-ui/react-dialog | 1.1.17 | Create/edit world modal | [VERIFIED: npm registry] — underlies shadcn/ui Dialog component |
| @radix-ui/react-alert-dialog | 1.1.17 | Delete confirmation modal | [VERIFIED: npm registry] — underlies shadcn/ui AlertDialog component |

> Note: `zod`, `slugify`, `@radix-ui/react-dialog`, and `@radix-ui/react-alert-dialog` were installed during research via slopcheck verification — they are already in `package.json`. No additional install step needed.

**shadcn/ui components to copy-paste** (not npm packages — run `npx shadcn@latest add <component>`):
- `dialog` — wraps `@radix-ui/react-dialog`
- `alert-dialog` — wraps `@radix-ui/react-alert-dialog`
- `textarea` — for world description field
- `badge` — for public/private status indicator
- `card` — for world list cards on dashboard
- `separator` — for layout divisions
- `dropdown-menu` — for world card action menu (edit/delete)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | Route Handlers | Route Handlers require manual fetch() from client; Server Actions integrate with `useActionState` and form `action=` prop directly — better DX for CRUD forms |
| `updateTag` for cache | `revalidatePath` | `updateTag` provides read-your-writes (immediate refresh); `revalidatePath` marks for revalidation on next visit. For a dashboard the user immediately sees after creating a world, `updateTag` is correct. |
| slugify | Custom regex | Custom slug generation misses edge cases (Unicode, accents, consecutive hyphens). `slugify` handles all these. |
| Zod v4 | Yup | Zod v4 is the pattern in Next.js 16 official docs; TypeScript inference is superior |

---

## Package Legitimacy Audit

> slopcheck installed and run successfully during research.

| Package | Registry | Age | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|
| zod | npm | ~4 yrs | [OK] | Approved |
| slugify | npm | ~9 yrs | [OK] | Approved |
| @radix-ui/react-dialog | npm | ~3 yrs | [OK] | Approved |
| @radix-ui/react-alert-dialog | npm | ~3 yrs | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client)
  |
  +-- Dashboard Page (RSC) — /dashboard
  |     |
  |     +-- fetches worlds WHERE owner_id = session.userId
  |     +-- renders WorldCard list (RSC)
  |           |
  |           +-- WorldActionMenu (Client) — opens Dialog/AlertDialog
  |
  +-- CreateWorldDialog (Client) — "new world" button
  |     |
  |     +-- useActionState(createWorldAction)
  |     +-- form action → createWorldAction (Server Action)
  |           |
  |           +-- Zod validation
  |           +-- slugify(name) → deduplicate slug against DB
  |           +-- db.insert(worlds)
  |           +-- updateTag(`worlds-${userId}`)
  |           +-- redirect('/worlds/[slug]') or return errors
  |
  +-- World Layout (RSC) — /worlds/[slug]/layout.tsx
  |     |
  |     +-- await params → slug
  |     +-- db.select world WHERE slug = slug AND owner_id = userId
  |     +-- 404 if not found / not owned
  |     +-- passes world to children via layout
  |
  +-- World Overview Page (RSC) — /worlds/[slug]/page.tsx
        |
        +-- reads world from parent layout query (or re-fetches)
        +-- renders world metadata + edit/delete actions
```

### Recommended Project Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # world list (RSC — queries by owner)
│   │   └── layout.tsx            # existing authenticated layout
│   └── (worlds)/                 # new route group — no URL impact
│       └── worlds/
│           └── [slug]/
│               ├── layout.tsx    # world context layout (RSC — fetches world by slug+owner)
│               └── page.tsx      # world overview page (RSC)
├── components/
│   ├── worlds/
│   │   ├── world-card.tsx        # dashboard world card (RSC-compatible)
│   │   ├── world-form.tsx        # create/edit form (Client — useActionState)
│   │   ├── create-world-dialog.tsx  # dialog wrapper (Client)
│   │   ├── edit-world-dialog.tsx    # dialog wrapper (Client)
│   │   └── delete-world-dialog.tsx  # alert-dialog (Client)
│   └── ui/
│       ├── dialog.tsx            # shadcn/ui Dialog (Phase 2 addition)
│       ├── alert-dialog.tsx      # shadcn/ui AlertDialog (Phase 2 addition)
│       ├── textarea.tsx          # shadcn/ui Textarea (Phase 2 addition)
│       ├── badge.tsx             # shadcn/ui Badge (Phase 2 addition)
│       ├── card.tsx              # shadcn/ui Card (Phase 2 addition)
│       └── dropdown-menu.tsx     # shadcn/ui DropdownMenu (Phase 2 addition)
└── lib/
    ├── actions/
    │   └── worlds.ts             # Server Actions: createWorld, updateWorld, deleteWorld, togglePrivacy
    ├── db/
    │   ├── schema.ts             # update worlds table: composite unique constraint
    │   └── queries/
    │       └── worlds.ts         # query helpers: getWorldsByOwner, getWorldBySlug
    └── validations/
        └── worlds.ts             # Zod schemas for world create/update
```

### Pattern 1: Server Action with Zod v4 Validation

**What:** Server Action validates input, writes to DB, updates cache, redirects or returns errors.
**When to use:** All world mutations (create, update, delete, privacy toggle).

```typescript
// Source: Next.js 16 official docs — node_modules/next/dist/docs/01-app/02-guides/forms.md
// + Zod v4 API verified against installed node_modules/zod v4.4.3

'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { updateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { worlds } from '@/lib/db/schema'

// IMPORTANT: In Zod v4, error messages use { error: } not { message: }
const CreateWorldSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }).max(100, { error: 'Name must be 100 characters or fewer' }),
  description: z.string().max(500, { error: 'Description must be 500 characters or fewer' }).optional(),
})

export type CreateWorldState = {
  errors?: { name?: string[]; description?: string[] }
  message?: string
}

export async function createWorldAction(
  prevState: CreateWorldState,
  formData: FormData
): Promise<CreateWorldState> {
  // Always verify auth in Server Actions
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = CreateWorldSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, description } = validated.data
  const slug = await generateUniqueSlug(name, session.user.id)

  await db.insert(worlds).values({
    name,
    description: description ?? null,
    slug,
    ownerId: session.user.id,
    isPublic: false,
  })

  // updateTag for read-your-writes — user sees new world immediately
  // Source: Next.js 16 docs — revalidateTag now requires cacheLife profile;
  // updateTag is the correct pattern for immediate CRUD feedback
  updateTag(`worlds-${session.user.id}`)

  redirect(`/worlds/${slug}`)
}
```

### Pattern 2: Reading Async Params in Next.js 16

**What:** In Next.js 16, `params` is a Promise — must be awaited.
**When to use:** All dynamic route pages and layouts (world layout, world page).

```typescript
// Source: Next.js 16 upgrade guide — node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
// CRITICAL: Synchronous params access is REMOVED in Next.js 16

// WRONG (Next.js 15 pattern — REMOVED in 16):
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params  // ← throws in Next.js 16
}

// CORRECT (Next.js 16):
export default async function WorldLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) {
  const { slug } = await params  // ← required in Next.js 16
  // ... fetch world by slug
}
```

### Pattern 3: useActionState for Form with Inline Errors

**What:** Client Component wraps a form, receives Server Action state, displays field errors.
**When to use:** CreateWorldDialog, EditWorldDialog.

```typescript
// Source: Next.js 16 official docs — node_modules/next/dist/docs/01-app/02-guides/forms.md

'use client'

import { useActionState } from 'react'
import { createWorldAction } from '@/lib/actions/worlds'

const initialState = { errors: {} }

export function WorldForm() {
  const [state, formAction, pending] = useActionState(createWorldAction, initialState)

  return (
    <form action={formAction}>
      <input name="name" />
      {state.errors?.name && <p>{state.errors.name[0]}</p>}
      <textarea name="description" />
      {state.errors?.description && <p>{state.errors.description[0]}</p>}
      <button disabled={pending}>
        {pending ? 'Creating...' : 'Create World'}
      </button>
    </form>
  )
}
```

### Pattern 4: Slug Generation with Per-User Uniqueness

**What:** Generate a base slug from the world name, then deduplicate against existing slugs for this user.
**When to use:** createWorldAction only (edit does not regenerate slug).

```typescript
// Source: slugify v1.6.9 — verified API in research session

import slugify from 'slugify'
import { db } from '@/lib/db'
import { worlds } from '@/lib/db/schema'
import { eq, and, like } from 'drizzle-orm'

async function generateUniqueSlug(name: string, ownerId: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true })

  // Check for existing slugs with this base (for this owner)
  const existing = await db
    .select({ slug: worlds.slug })
    .from(worlds)
    .where(and(eq(worlds.ownerId, ownerId), like(worlds.slug, `${base}%`)))

  if (!existing.some(r => r.slug === base)) return base

  // Find next available suffix
  let i = 2
  while (existing.some(r => r.slug === `${base}-${i}`)) i++
  return `${base}-${i}`
}
```

### Pattern 5: updateTag vs revalidateTag (Next.js 16 Breaking Change)

**What:** In Next.js 16, `revalidateTag` requires a `cacheLife` second argument. For CRUD on a dashboard, use `updateTag` for immediate consistency.
**When to use:** After every world mutation (create, update, delete, privacy toggle).

```typescript
// Source: Next.js 16 upgrade guide — node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md

// WRONG in Next.js 16 (single-argument revalidateTag is deprecated):
revalidateTag('worlds')  // ← TypeScript error in Next.js 16

// CORRECT for CRUD mutations (immediate refresh, read-your-writes):
import { updateTag } from 'next/cache'
updateTag(`worlds-${userId}`)  // ← expires cache and refreshes immediately

// CORRECT for eventual consistency (stale-while-revalidate is acceptable):
import { revalidateTag } from 'next/cache'
revalidateTag(`worlds-${userId}`, 'max')  // ← second argument required in Next.js 16
```

### Anti-Patterns to Avoid

- **Sync params access in dynamic routes:** `params.slug` (no await) throws in Next.js 16. Always `const { slug } = await params`.
- **Single-argument revalidateTag:** `revalidateTag('tag')` without a cacheLife profile is deprecated in Next.js 16 and produces a TypeScript error. Use `updateTag` for mutations.
- **Zod v3 error message syntax:** `z.string().min(2, { message: 'too short' })` — in Zod v4, use `{ error: 'too short' }`. The `message` key still works but `error` is the canonical v4 key.
- **Globally unique slugs:** The existing schema has `UNIQUE(slug)` globally. Phase 2 MUST migrate this to `UNIQUE(owner_id, slug)` before any world creation works correctly.
- **Route Handlers for mutations:** Do not use `/api/worlds` Route Handlers for CRUD. Server Actions integrate better with form state, pending UX, and cache invalidation.
- **"use client" at page level:** Keep page.tsx and layout.tsx as Server Components. Push `"use client"` only to leaf components that need form state (WorldForm, dialogs).

---

## Critical Schema Migration

### The Problem

The existing `worlds` table has:
```sql
CONSTRAINT "worlds_slug_unique" UNIQUE("slug")
```

This enforces globally unique slugs (e.g., only one user can have `/worlds/my-world`). The Phase 2 UAT requires slugs to be unique per user account, not globally.

### The Fix (new Drizzle migration in Phase 2 Wave 0)

Update `src/lib/db/schema.ts` to change the worlds table definition:

```typescript
// Before (Phase 1):
export const worlds = pgTable("worlds", {
  slug: text("slug").notNull().unique(),  // globally unique
  // ...
})

// After (Phase 2):
export const worlds = pgTable(
  "worlds",
  {
    slug: text("slug").notNull(),  // remove .unique() here
    // ... all other columns unchanged
  },
  (table) => ({
    // composite: slug unique per owner
    ownerSlugUnique: unique("worlds_owner_id_slug_unique").on(
      table.ownerId,
      table.slug
    ),
  })
)
```

Run `npx drizzle-kit generate` then `npx drizzle-kit migrate` to produce and apply the migration.

**Generated SQL (expected):**
```sql
ALTER TABLE "worlds" DROP CONSTRAINT "worlds_slug_unique";
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_owner_id_slug_unique" UNIQUE("owner_id","slug");
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug from name | Custom regex/replace | `slugify` | Handles Unicode, accents, special chars, consecutive hyphens — all edge cases |
| Form validation | Manual field checking | Zod v4 `safeParse` | Type-safe, composable, integrates with `useActionState` error shape |
| Delete confirmation | Custom modal from scratch | shadcn/ui AlertDialog | Accessible (focus trap, escape key, aria), pre-styled to match design system |
| World create/edit form | Custom modal from scratch | shadcn/ui Dialog | Same accessibility story + controlled open state |
| Cache invalidation after mutation | Manual router.refresh() chain | `updateTag` (Next.js 16) | Read-your-writes semantics — user sees mutation result immediately |

**Key insight:** The shadcn/ui Dialog and AlertDialog components handle all focus management, keyboard navigation, and ARIA attributes that are easy to miss in a custom implementation. They also require zero runtime bundle overhead beyond `@radix-ui/react-dialog`.

---

## Common Pitfalls

### Pitfall 1: Globally Unique Slug Constraint Not Migrated

**What goes wrong:** The first user creates "my-world". The second user tries to create "my-world" and gets a database unique constraint violation error — even though it should be allowed (different owner).
**Why it happens:** Phase 1 schema defined `UNIQUE(slug)` globally.
**How to avoid:** Phase 2 Wave 0 must migrate the constraint to `UNIQUE(owner_id, slug)` before any world creation UI exists.
**Warning signs:** `PgError: duplicate key value violates unique constraint "worlds_slug_unique"` when two different users create a world with the same name.

### Pitfall 2: Forgetting `await params` in Dynamic Route Handlers

**What goes wrong:** `params.slug` (without await) throws a runtime error in Next.js 16. Synchronous params access was removed in Next.js 16 (it was only a deprecated compatibility shim in 15).
**Why it happens:** Training data and old tutorials show synchronous params access. AGENTS.md explicitly warns that "this version has breaking changes."
**How to avoid:** Every dynamic page and layout must `const { slug } = await params`.
**Warning signs:** `TypeError: Cannot read properties of a Promise` or similar at runtime.

### Pitfall 3: Using `revalidateTag` Without cacheLife Profile

**What goes wrong:** `revalidateTag('worlds')` compiles in Next.js 15 but is deprecated in Next.js 16 — it produces a TypeScript error and the behavior is undefined.
**Why it happens:** Next.js 16 introduced a mandatory second argument (`cacheLife` profile) for `revalidateTag`. For CRUD mutation feedback, `updateTag` is the correct API.
**How to avoid:** Use `updateTag(`worlds-${userId}`)` in Server Actions that mutate world data. Reserve `revalidateTag` with a profile for background/eventual revalidation use cases.
**Warning signs:** TypeScript error on `revalidateTag` calls with a single argument.

### Pitfall 4: Zod v4 `error` vs `message` Key

**What goes wrong:** Using `z.string().min(2, { message: 'too short' })` — the `message` key is technically still accepted in Zod v4 but the canonical API is `{ error: 'too short' }`. Custom validators using the old error format may produce unexpected behavior.
**Why it happens:** Zod v4 is a new major version with a changed error customization API.
**How to avoid:** Use `{ error: '...' }` for all Zod validation messages. The `z.email()` function is now top-level (not `z.string().email()`).
**Warning signs:** Error messages that don't appear or show generic Zod messages instead of custom ones.

### Pitfall 5: Privacy Toggle Stale Cache

**What goes wrong:** Builder toggles a world to public. The world overview page still shows "Private" because the RSC page is cached.
**Why it happens:** Next.js 16 caches RSC pages. A mutation without cache invalidation leaves the page stale.
**How to avoid:** The `togglePrivacyAction` Server Action must call `updateTag(`world-${worldId}`)` and the world fetch must use `cacheTag('world-${worldId}')` or `dynamic = 'force-dynamic'` on the page.
**Warning signs:** Privacy badge doesn't update after toggle until hard refresh.

---

## Code Examples

### World Dashboard Query (Server Component)

```typescript
// Source: Drizzle ORM 0.45.2 — verified API against installed node_modules

import { db } from '@/lib/db'
import { worlds } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// Called from RSC dashboard page — auth session already verified by layout
export async function getWorldsByOwner(ownerId: string) {
  return db
    .select()
    .from(worlds)
    .where(eq(worlds.ownerId, ownerId))
    .orderBy(desc(worlds.updatedAt))
}
```

### World Layout Auth Guard

```typescript
// Source: Next.js 16 upgrade guide — async params pattern

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { worlds } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export default async function WorldLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) {
  const { slug } = await params  // Next.js 16: params is a Promise
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.slug, slug), eq(worlds.ownerId, session.user.id)))
    .limit(1)

  if (!world) notFound()

  return <>{children}</>
}
```

### Delete World Action

```typescript
// Source: Drizzle ORM 0.45.2 + Next.js 16 docs

'use server'

import { redirect } from 'next/navigation'
import { updateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { worlds } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function deleteWorldAction(worldId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  // Always scope delete to owner — prevent deletion of other users' worlds
  await db
    .delete(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))

  updateTag(`worlds-${session.user.id}`)
  redirect('/dashboard')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` named export | `proxy.ts` named `proxy` function | Next.js 16 | Phase 1 already migrated — no action needed |
| Synchronous `params.slug` | `const { slug } = await params` | Next.js 16 | Every dynamic route page/layout must await params |
| `revalidateTag('tag')` single arg | `updateTag('tag')` or `revalidateTag('tag', 'max')` | Next.js 16 | Use `updateTag` for CRUD; `revalidateTag` with cacheLife profile for background revalidation |
| `z.string().email()` | `z.email()` (top-level) | Zod v4 | Minor — old form still works but not canonical |
| `{ message: '...' }` in Zod validators | `{ error: '...' }` | Zod v4 | Canonical error key changed |

**Deprecated/outdated:**
- `middleware` filename convention: renamed to `proxy` in Next.js 16. Phase 1 already uses `proxy.ts` — verified.
- `experimental.turbopack` in next.config: now top-level `turbopack`. Not relevant to Phase 2 but worth noting for config work.
- Single-argument `revalidateTag`: deprecated in Next.js 16, requires cacheLife profile as second arg.

---

## Project Constraints (from CLAUDE.md → AGENTS.md)

CLAUDE.md defers to AGENTS.md, which states:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Verified implications for Phase 2:**
- `params` in dynamic routes is a Promise — must `await params` everywhere.
- `middleware.ts` is renamed to `proxy.ts` — Phase 1 already compliant.
- `revalidateTag` requires a `cacheLife` second argument in Next.js 16 — use `updateTag` for mutations instead.
- Turbopack is now on by default for `next dev` and `next build`.
- No synchronous access to `cookies()`, `headers()`, or `params` — all async.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `slugify(name, { lower: true, strict: true })` is the correct API for the installed v1.6.9 | Code Examples | Slug generation produces wrong output — verified in research session by running node, so risk is LOW |
| A2 | shadcn/ui `npx shadcn@latest add dialog` works with Tailwind v4 CSS-first config | Standard Stack | shadcn CLI may fail like it did in Phase 1 — manual copy-paste fallback is the known workaround |
| A3 | `auth.api.getSession({ headers: await headers() })` is the correct Better Auth server pattern | Code Examples | Auth fails silently in Server Actions — same pattern used successfully in Phase 1 layout |

---

## Open Questions

1. **World overview page content**
   - What we know: Phase 2 scope includes "world dashboard: list all worlds" and "world-scoped routing `/worlds/[slug]/...`"
   - What's unclear: What does the `/worlds/[slug]/page.tsx` actually show? Entities (Phase 3), settings, or a placeholder?
   - Recommendation: Ship a world overview page with world metadata (name, description, privacy badge, edit/delete actions) and a "Phase 3 coming soon" entity section placeholder. This satisfies the UAT without over-building.

2. **Sidebar world context behavior**
   - What we know: Phase 1 CONTEXT.md D-02 specifies contextual sidebar — "when inside a specific world, show entity types and world sections"
   - What's unclear: Should Phase 2 implement this sidebar context switching, or is it deferred to Phase 3 when entity types actually exist?
   - Recommendation: Implement the world-context sidebar switch in Phase 2 as a placeholder (show world name + "Entities coming in Phase 3" section). The routing and layout foundation is needed now.

3. **Proxy.ts protection for `/worlds/[slug]`**
   - What we know: The current proxy.ts only protects `/dashboard`. World routes are auth-gated by the layout.
   - What's unclear: Should proxy.ts be updated to also protect `/worlds/:path*`?
   - Recommendation: Yes — update proxy.ts matcher to include `/worlds/:path*` for the redirect. Keep the belt-and-suspenders check in the layout. This prevents unauthenticated users from hitting the layout DB query at all.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | 22.17.1 | — |
| npm | Package installs | ✓ | bundled | — |
| Neon PostgreSQL | DB queries | .env.local present | — | Must provision if not yet done |
| drizzle-kit | Schema migration | ✓ | 0.31.10 | — |

**Note on Neon:** `.env.local` exists but the actual Neon database provisioning depends on Phase 1 completion steps documented in `01-SUMMARY.md`. The schema migration for Phase 2 (`UNIQUE(owner_id, slug)`) will fail if the database is not yet provisioned.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured — Next.js 16 project, no test runner installed |
| Config file | none |
| Quick run command | n/a — no test infrastructure |
| Full suite command | n/a |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UAT-1 | Create world with name, description, auto-slug | manual | n/a | — |
| UAT-2 | Dashboard lists all user worlds | manual | n/a | — |
| UAT-3 | Edit world name/description | manual | n/a | — |
| UAT-4 | Delete world with confirmation | manual | n/a | — |
| UAT-5 | Slug unique per user account | manual | n/a | — |
| UAT-6 | Private world not accessible to unauthenticated users | manual | n/a | — |

### Wave 0 Gaps
- No test framework is installed. `nyquist_validation` is enabled but there is no test infrastructure to run. The planner should add a task to install Vitest + Testing Library if automated validation is required, or accept that UAT items are verified manually. Given the project is in early phases with no existing test infrastructure, manual UAT verification is the pragmatic path for Phase 2.

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` — ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth session verified in every Server Action via `auth.api.getSession` |
| V3 Session Management | yes | Better Auth httpOnly cookies — handled by Phase 1 config, no new work |
| V4 Access Control | yes | Every DB mutation scoped to `ownerId = session.user.id` — prevents cross-user data access |
| V5 Input Validation | yes | Zod v4 `safeParse` on all Server Action inputs before DB write |
| V6 Cryptography | no | No new cryptographic operations in Phase 2 |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on world delete/edit | Tampering | `WHERE id = ? AND owner_id = ?` on all mutations — verified in code examples |
| Mass assignment via FormData | Tampering | Zod schema allowlist — only `name`, `description`, `isPublic` accepted; other fields ignored |
| Unauthenticated world access | Information Disclosure | proxy.ts redirect + layout auth guard (belt-and-suspenders) |
| Slug enumeration (guessing other users' world URLs) | Information Disclosure | Layout returns 404 (not 403) when world not found OR not owned — prevents confirming existence |
| Server Action forgery (CSRF) | Tampering | Better Auth `nextCookies()` plugin handles CSRF via SameSite cookie — already in Phase 1 config |

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 local docs — `node_modules/next/dist/docs/` — async params, Server Actions, forms, revalidation, proxy.ts, upgrading/version-16.md
- Drizzle ORM 0.45.2 — `node_modules/drizzle-orm/pg-core/db.d.ts` — query API types verified
- Zod v4.4.3 — `node_modules/zod/` — API verified by running `node -e` tests in research session
- slugify 1.6.9 — `node_modules/slugify/` — API verified by running `node -e` test

### Secondary (MEDIUM confidence)
- slopcheck — confirmed all 4 new packages [OK]
- Phase 1 codebase — `src/lib/db/schema.ts`, `src/lib/auth/index.ts`, `src/proxy.ts` — existing patterns confirmed

### Tertiary (LOW confidence)
- None — all architectural claims verified against local docs or source code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified locally; Next.js 16 docs read directly from installed version
- Architecture: HIGH — follows patterns established in Phase 1 and documented in Next.js 16 official docs
- Pitfalls: HIGH — breaking changes verified from `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Schema migration: HIGH — constraint names verified from actual migration SQL files

**Research date:** 2026-06-19
**Valid until:** 2026-07-19 (Next.js 16 is stable; no fast-moving APIs in this phase's scope)
