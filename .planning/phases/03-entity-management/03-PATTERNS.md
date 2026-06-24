# Phase 3: Entity Management — Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 18
**Analogs found:** 17 / 18 (proxy.ts requires no change — see note)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/db/schema.ts` | model/config | CRUD | `src/lib/db/schema.ts` (self) | exact |
| `src/lib/db/queries/entities.ts` | service | CRUD | `src/lib/db/queries/worlds.ts` | exact |
| `src/lib/db/queries/entity-types.ts` | service | CRUD | `src/lib/db/queries/worlds.ts` | exact |
| `src/lib/actions/entities.ts` | service | request-response | `src/lib/actions/worlds.ts` | exact |
| `src/lib/actions/entity-types.ts` | service | request-response | `src/lib/actions/worlds.ts` | exact |
| `src/lib/validations/entities.ts` | utility | transform | `src/lib/validations/worlds.ts` | exact |
| `src/components/entities/entity-form.tsx` | component | request-response | `src/components/worlds/world-form.tsx` | exact |
| `src/components/entities/entity-card.tsx` | component | request-response | `src/components/worlds/world-card.tsx` | exact |
| `src/components/entities/create-entity-dialog.tsx` | component | request-response | `src/components/worlds/create-world-dialog.tsx` | exact |
| `src/components/entities/edit-entity-dialog.tsx` | component | request-response | `src/components/worlds/edit-world-dialog.tsx` | exact |
| `src/components/entities/delete-entity-dialog.tsx` | component | request-response | `src/components/worlds/delete-world-dialog.tsx` | exact |
| `src/components/entity-types/entity-type-form.tsx` | component | request-response | `src/components/worlds/world-form.tsx` | exact |
| `src/components/entity-types/create-entity-type-dialog.tsx` | component | request-response | `src/components/worlds/create-world-dialog.tsx` | exact |
| `src/app/(worlds)/worlds/[slug]/entities/page.tsx` | page | CRUD | `src/app/(app)/dashboard/page.tsx` | role-match |
| `src/app/(worlds)/worlds/[slug]/entities/[entity-slug]/page.tsx` | page | CRUD | `src/app/(worlds)/worlds/[slug]/page.tsx` | exact |
| `src/app/(worlds)/worlds/[slug]/entity-types/page.tsx` | page | CRUD | `src/app/(app)/dashboard/page.tsx` | role-match |
| `src/components/layout/sidebar.tsx` | component | event-driven | `src/components/layout/sidebar.tsx` (self) | exact |
| `src/proxy.ts` | middleware | request-response | — | no change needed |

---

## Pattern Assignments

### `src/lib/db/schema.ts` (modify — add entities table)

**Analog:** `src/lib/db/schema.ts` (self — extend the existing file)

**Critical: existing imports to extend** (lines 6–12):
```typescript
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
  // ADD: jsonb if storing custom field values; add integer if needed
} from "drizzle-orm/pg-core";
```

**Existing table pattern to copy exactly** (entityTypes, lines 48–70):
```typescript
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    entityTypeId: uuid("entity_type_id")
      .notNull()
      .references(() => entityTypes.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    // slug unique per world (mirrors entityTypes worldSlugUnique pattern)
    worldSlugUnique: unique("entities_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
);
```

**Exports pattern** (lines 79–88 — append after existing exports):
```typescript
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

Add `entities` to the `appSchema` object:
```typescript
export const appSchema = { worlds, entityTypes, entities };
```

---

### `src/lib/db/queries/entities.ts` (new)

**Analog:** `src/lib/db/queries/worlds.ts`

**Imports pattern** (lines 1–5):
```typescript
// no cacheTag — consumers use dynamic='force-dynamic' (RESEARCH Pitfall 5)

import { db } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
```

**Core CRUD pattern** (lines 7–25 of worlds.ts):
```typescript
/**
 * Returns all entities for a given world, ordered by most recently updated.
 * World-scoped — worldId must come from a pre-verified world object.
 */
export async function getEntitiesByWorld(worldId: string) {
  return db
    .select()
    .from(entities)
    .where(eq(entities.worldId, worldId))
    .orderBy(desc(entities.updatedAt));
}

/**
 * Returns a single entity by slug scoped to a specific world (IDOR-safe via parent world).
 * Never queries by slug alone.
 */
export async function getEntityBySlug(slug: string, worldId: string) {
  const [entity] = await db
    .select()
    .from(entities)
    .where(and(eq(entities.slug, slug), eq(entities.worldId, worldId)))
    .limit(1);
  return entity ?? null;
}
```

**IDOR note:** Entity queries scope to `worldId`. World ownership is already verified in the layout (`getWorldBySlug(slug, session.user.id)`), so the `worldId` that reaches these queries is already ownership-verified. Direct action calls must re-verify world ownership independently (see actions pattern below).

---

### `src/lib/db/queries/entity-types.ts` (new)

**Analog:** `src/lib/db/queries/worlds.ts`

**Core pattern** — same worldId-scoping as entity queries:
```typescript
import { db } from "@/lib/db";
import { entityTypes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getEntityTypesByWorld(worldId: string) {
  return db
    .select()
    .from(entityTypes)
    .where(eq(entityTypes.worldId, worldId))
    .orderBy(asc(entityTypes.name));
}

export async function getEntityTypeBySlug(slug: string, worldId: string) {
  const [entityType] = await db
    .select()
    .from(entityTypes)
    .where(and(eq(entityTypes.slug, slug), eq(entityTypes.worldId, worldId)))
    .limit(1);
  return entityType ?? null;
}
```

---

### `src/lib/actions/entities.ts` (new)

**Analog:** `src/lib/actions/worlds.ts`

**"use server" + imports pattern** (lines 1–19):
```typescript
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entities, worlds } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";
import slugify from "slugify";
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  EntityActionState,
} from "@/lib/validations/entities";
```

**Auth pattern** (line 55 of worlds.ts — copy verbatim):
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) throw new Error("Unauthorized");
```

**IDOR-safe parent-world verification** — entities actions must verify world ownership before operating. This is additional vs. worlds actions (which own the top-level resource directly):
```typescript
// Verify the world exists AND belongs to this user — prevents IDOR on worldId
const [world] = await db
  .select({ id: worlds.id, ownerId: worlds.ownerId })
  .from(worlds)
  .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
  .limit(1);
if (!world) throw new Error("Unauthorized");
```

**Zod validation pattern** (lines 58–63 of worlds.ts):
```typescript
const validated = CreateEntitySchema.safeParse({
  name: formData.get("name"),
  description: formData.get("description"),
  entityTypeId: formData.get("entityTypeId"),
});
if (!validated.success) {
  return { errors: validated.error.flatten().fieldErrors };
}
```

**Slug generation** — reuse the same generateUniqueSlug helper pattern from worlds.ts, but scope the uniqueness check to `worldId`:
```typescript
async function generateUniqueSlug(name: string, worldId: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  const existing = await db
    .select({ slug: entities.slug })
    .from(entities)
    .where(and(eq(entities.worldId, worldId), like(entities.slug, `${base}%`)));
  if (!existing.some((r) => r.slug === base)) return base;
  let i = 2;
  while (existing.some((r) => r.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}
```

**revalidatePath pattern** — use the world-scoped path:
```typescript
revalidatePath(`/worlds/${worldSlug}/entities`);
```

**Delete action pattern** (lines 122–135 of worlds.ts) — scope to both entity id AND worldId (which is already ownership-verified above):
```typescript
await db
  .delete(entities)
  .where(and(eq(entities.id, entityId), eq(entities.worldId, world.id)));
```

---

### `src/lib/actions/entity-types.ts` (new)

**Analog:** `src/lib/actions/worlds.ts`

Identical pattern to `entities.ts` actions. Key difference: entity types use the same parent-world IDOR verification pattern, then operate on the `entityTypes` table. Slug uniqueness scoped to `worldId`. On delete: use `onDelete: "restrict"` (entity types cannot be deleted if entities reference them — enforce this in the action by checking for dependent entities before deleting, or let the DB constraint surface the error).

---

### `src/lib/validations/entities.ts` (new)

**Analog:** `src/lib/validations/worlds.ts`

**Critical — Zod v4 error syntax** (line 3 comment in worlds.ts):
```typescript
// IMPORTANT: Zod v4 uses { error: '...' } not { message: '...' }
import { z } from "zod";

export const CreateEntitySchema = z.object({
  name: z
    .string()
    .min(1, { error: "Entity name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { error: "Description must be 500 characters or fewer." })
    .optional(),
  entityTypeId: z
    .string()
    .uuid({ error: "A valid entity type is required." }),
});

export type EntityActionState = {
  errors?: {
    name?: string[];
    description?: string[];
    entityTypeId?: string[];
  };
  message?: string;
};
```

**Zod v4 `entity-types` validation** — same shape, no `entityTypeId` field:
```typescript
export const CreateEntityTypeSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Type name is required." })
    .max(50, { error: "Name must be 50 characters or fewer." }),
  icon: z.string().optional(),
});
```

---

### `src/components/entities/entity-form.tsx` (new)

**Analog:** `src/components/worlds/world-form.tsx`

**"use client" + imports + useActionState pattern** (lines 1–10):
```typescript
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EntityActionState } from "@/lib/validations/entities";
```

**useActionState form pattern** (lines 33–47 of world-form.tsx):
```typescript
const [state, formAction, pending] = useActionState(action, { errors: {} });

useEffect(() => {
  if (state.message === "saved") {
    onSuccess?.();
  }
}, [state.message, onSuccess]);
```

**Error display pattern per field** (lines 54–60 of world-form.tsx):
```typescript
{state.errors?.name && (
  <p id="name-error" className="text-sm text-destructive mt-1">
    {state.errors.name[0]}
  </p>
)}
```

**Entity type selector** — add a `<select>` or shadcn `<Select>` for `entityTypeId`. Pass available types as a prop: `entityTypes: EntityType[]`.

---

### `src/components/entities/entity-card.tsx` (new)

**Analog:** `src/components/worlds/world-card.tsx`

**"use client" + useState for dialogs pattern** (lines 1–22):
```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Entity } from "@/lib/db/schema";

export function EntityCard({ entity, worldSlug }: { entity: Entity; worldSlug: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // ...
}
```

**Link pattern** — use nested slug:
```typescript
<Link href={`/worlds/${worldSlug}/entities/${entity.slug}`}>
  {entity.name}
</Link>
```

---

### `src/components/entities/create-entity-dialog.tsx` (new)

**Analog:** `src/components/worlds/create-world-dialog.tsx`

**Controlled Dialog with useState trigger pattern** (full file, ~40 lines):
```typescript
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EntityForm } from "@/components/entities/entity-form";
import { createEntityAction } from "@/lib/actions/entities";

export function CreateEntityDialog({ worldId, entityTypes }: Props) {
  const [open, setOpen] = useState(false);
  // bind worldId into the action:
  const boundAction = useMemo(() => createEntityAction.bind(null, worldId), [worldId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus size={16} />New Entity</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <EntityForm
          action={boundAction}
          entityTypes={entityTypes}
          submitLabel="Create Entity"
          pendingLabel="Creating..."
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

### `src/components/entities/edit-entity-dialog.tsx` (new)

**Analog:** `src/components/worlds/edit-world-dialog.tsx`

**External open/onOpenChange + useMemo bound action pattern** (full file, ~35 lines):
```typescript
"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, ... } from "@/components/ui/dialog";
import { EntityForm } from "@/components/entities/entity-form";
import { updateEntityAction } from "@/lib/actions/entities";
import type { Entity, EntityType } from "@/lib/db/schema";

interface EditEntityDialogProps {
  entity: Entity;
  worldId: string;
  entityTypes: EntityType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntityDialog({ entity, worldId, entityTypes, open, onOpenChange }: EditEntityDialogProps) {
  const boundAction = useMemo(
    () => updateEntityAction.bind(null, worldId, entity.id),
    [worldId, entity.id]
  );
  // ...
}
```

---

### `src/components/entities/delete-entity-dialog.tsx` (new)

**Analog:** `src/components/worlds/delete-world-dialog.tsx`

**AlertDialog + useTransition pattern** (full file, ~50 lines):
```typescript
"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteEntityAction } from "@/lib/actions/entities";
import type { Entity } from "@/lib/db/schema";

interface DeleteEntityDialogProps {
  entity: Entity;
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEntityDialog({ entity, worldId, open, onOpenChange }: DeleteEntityDialogProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteEntityAction(worldId, entity.id);
    });
  }
  // ...
}
```

---

### `src/components/entity-types/entity-type-form.tsx` (new)

**Analog:** `src/components/worlds/world-form.tsx`

Identical structure. No slug preview needed (entity type slugs are auto-generated from name). Fields: `name` (required), `icon` (optional text input for Lucide icon name).

---

### `src/components/entity-types/create-entity-type-dialog.tsx` (new)

**Analog:** `src/components/worlds/create-world-dialog.tsx`

Identical structure. Bind `worldId` into the action via `useMemo` (same as create-entity-dialog).

---

### `src/app/(worlds)/worlds/[slug]/entities/page.tsx` (new — entity list RSC)

**Analog:** `src/app/(app)/dashboard/page.tsx`

**force-dynamic + auth + query pattern** (lines 1–15 of dashboard/page.tsx):
```typescript
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntitiesByWorld } from "@/lib/db/queries/entities";

export const dynamic = "force-dynamic";

export default async function EntitiesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;  // CRITICAL: params is a Promise in Next.js 16

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entities = await getEntitiesByWorld(world.id);
  // ...
}
```

**Empty state pattern** (lines 22–30 of dashboard/page.tsx):
```tsx
{entities.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <h2 className="text-lg font-semibold">No entities yet</h2>
    <p className="text-sm text-muted-foreground mt-1 mb-6">
      Add your first entity to start populating this world.
    </p>
    <CreateEntityDialog worldId={world.id} entityTypes={entityTypes} />
  </div>
) : (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {entities.map((entity) => (
      <EntityCard key={entity.id} entity={entity} worldSlug={world.slug} />
    ))}
  </div>
)}
```

---

### `src/app/(worlds)/worlds/[slug]/entities/[entity-slug]/page.tsx` (new — entity detail)

**Analog:** `src/app/(worlds)/worlds/[slug]/page.tsx`

**Nested dynamic params pattern** — params contains BOTH `slug` (world) and `entity-slug` (entity). Destructure both from the awaited params:
```typescript
export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ slug: string; "entity-slug": string }>;
}) {
  const { slug, "entity-slug": entitySlug } = await params;
  // CRITICAL: Next.js 16 — always await params before destructuring
  // CRITICAL: hyphenated param name requires bracket notation

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entity = await getEntityBySlug(entitySlug, world.id);
  if (!entity) notFound();
  // ...
}
```

**Breadcrumb pattern** (lines 28–35 of world page.tsx):
```tsx
<p className="text-sm text-muted-foreground mb-4">
  <Link href="/dashboard" className="hover:underline underline-offset-4">Your Worlds</Link>
  {" / "}
  <Link href={`/worlds/${world.slug}`} className="hover:underline underline-offset-4">{world.name}</Link>
  {" / "}
  <Link href={`/worlds/${world.slug}/entities`} className="hover:underline underline-offset-4">Entities</Link>
  {" / "}
  {entity.name}
</p>
```

---

### `src/app/(worlds)/worlds/[slug]/entity-types/page.tsx` (new)

**Analog:** `src/app/(app)/dashboard/page.tsx`

Same RSC list pattern as entities page. Params: `Promise<{ slug: string }>`. Query: `getEntityTypesByWorld(world.id)`. Pass `worldId` down to `CreateEntityTypeDialog`.

---

### `src/components/layout/sidebar.tsx` (modify — replace placeholder)

**Analog:** `src/components/layout/sidebar.tsx` (self)

**Target: replace the inline placeholder block** (lines 99–108):
```typescript
// REMOVE THIS:
{(() => {
  const worldSlug = pathname.match(/^\/worlds\/([^/]+)/)?.[1];
  if (!worldSlug || !sidebarOpen) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="px-2 text-sm font-medium text-foreground truncate">
        {worldSlug}
      </p>
      <p className="px-2 mt-1 text-xs text-muted-foreground">
        Entities (Phase 3)
      </p>
    </div>
  );
})()}
```

**Replace with** — world-context nav items using the same Link + isActive pattern as the top `navItems` map (lines 64–82):
```typescript
{(() => {
  const worldSlug = pathname.match(/^\/worlds\/([^/]+)/)?.[1];
  if (!worldSlug) return null;

  const worldNavItems = [
    {
      href: `/worlds/${worldSlug}/entities`,
      label: "Entities",
      icon: <Users size={18} />,  // or use dynamic Lucide icon
    },
    {
      href: `/worlds/${worldSlug}/entity-types`,
      label: "Entity Types",
      icon: <Tag size={18} />,
    },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-border">
      {sidebarOpen && (
        <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {worldSlug}
        </p>
      )}
      {worldNavItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={!sidebarOpen ? item.label : undefined}
            className={`
              flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors
              ${isActive
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            <span className="shrink-0">{item.icon}</span>
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
})()}
```

Add `Users` and `Tag` (or appropriate icons) to the Lucide imports at top of file.

---

## Shared Patterns

### Authentication
**Source:** `src/lib/actions/worlds.ts` (lines 54–56)
**Apply to:** All Server Actions in `src/lib/actions/entities.ts` and `src/lib/actions/entity-types.ts`
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) throw new Error("Unauthorized");
```

### IDOR-safe Parent World Verification (new pattern — no exact analog)
**Apply to:** All entity and entity-type Server Actions that take a `worldId` argument
```typescript
// Verify the world belongs to the current user before operating on child resources
const [world] = await db
  .select({ id: worlds.id })
  .from(worlds)
  .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
  .limit(1);
if (!world) throw new Error("Unauthorized");
// Now safe to insert/update/delete entities scoped to world.id
```

### Zod v4 Validation
**Source:** `src/lib/validations/worlds.ts` (line 3 comment + all field definitions)
**Apply to:** All schemas in `src/lib/validations/entities.ts`
```typescript
// CRITICAL: Zod v4 uses { error: '...' } not { message: '...' }
.min(1, { error: "Field is required." })
.max(100, { error: "Must be 100 characters or fewer." })
```

### Cache Invalidation
**Source:** `src/lib/actions/worlds.ts` (lines 85–87, 106–109)
**Apply to:** All mutations in entity and entity-type actions
```typescript
updateTag(`world-${worldId}`);         // invalidate world-level cache
revalidatePath(`/worlds/${worldSlug}/entities`);   // revalidate list page
```

### force-dynamic RSC pages
**Source:** `src/app/(app)/dashboard/page.tsx` (line 8), `src/app/(worlds)/worlds/[slug]/page.tsx` (line 12)
**Apply to:** All new page.tsx files
```typescript
export const dynamic = "force-dynamic";
```

### Async Params (Next.js 16)
**Source:** `src/app/(worlds)/worlds/[slug]/page.tsx` (line 16), `src/app/(worlds)/worlds/[slug]/layout.tsx` (line 13)
**Apply to:** ALL new page.tsx and layout.tsx files
```typescript
// params is ALWAYS a Promise in Next.js 16 — must await before use
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
```

For nested dynamic routes with two params:
```typescript
// Both param names available after a single await
export default async function Page({ params }: {
  params: Promise<{ slug: string; "entity-slug": string }>;
}) {
  const { slug, "entity-slug": entitySlug } = await params;
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/proxy.ts` | middleware | request-response | `/worlds` is already covered by the matcher — entity routes under `/worlds/[slug]/entities` are automatically protected. No modification needed. |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/components/`, `src/app/`
**Files read:** 13
**Pattern extraction date:** 2026-06-24
