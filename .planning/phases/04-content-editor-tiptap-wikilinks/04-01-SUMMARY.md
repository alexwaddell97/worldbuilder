# 04-01 Summary: Tiptap 3.27.x Packages + Data Layer

## What Was Built

**Tiptap packages installed** at `^3.27.1`:
- `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/markdown`, `@tiptap/suggestion`

**Note:** The plan referenced `@tiptap/extension-markdown` but this package does not exist on npm. The correct package is `@tiptap/markdown` — used throughout this phase.

**Query helpers** added to `src/lib/db/queries/entities.ts`:
- `getEntitiesForAutocomplete(worldId, search, limit)` — parameterized ilike search, world-scoped, returns `{id, name, slug}[]`
- `updateWikilinkLabels(worldId, entityId, newLabel)` — JS fan-out walks Tiptap JSON tree, updates label on matching wikilink nodes
- `markWikilinksDead(worldId, entityId)` — JS fan-out walks Tiptap JSON tree, sets `dead=true` on matching wikilink nodes

**Server Actions** updated in `src/lib/actions/entities.ts`:
- `saveEntityContentAction(entityId, worldId, content)` — ownership-verified jsonb content save, no revalidatePath
- `updateEntityAction` — extended with `updateWikilinkLabels` call after rename (captures previous name before update)
- `deleteEntityAction` — extended with `markWikilinksDead` BEFORE the db.delete call

**Autocomplete route** created at `src/app/api/worlds/[slug]/entities/autocomplete/route.ts`:
- `export const dynamic = "force-dynamic"`, exports `GET`
- 401 for unauthenticated, 404 for unowned world, 200 + entity array for valid request
- Scoped to `session.user.id` via `getWorldBySlug(slug, session.user.id)`

## Verification

- `npx tsc --noEmit` exits 0 — zero TypeScript errors
- All three query helpers exported from `src/lib/db/queries/entities.ts`
- `saveEntityContentAction`, `updateWikilinkLabels`, `markWikilinksDead` all present in actions
- Autocomplete route uses parameterized queries (Drizzle ilike) — no SQL injection risk
