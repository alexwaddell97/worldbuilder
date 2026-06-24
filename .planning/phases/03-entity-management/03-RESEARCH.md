# Phase 3: Entity Types & Entity Management — Research

**Researched:** 2026-06-24
**Domain:** Drizzle ORM JSONB/arrays, Next.js 16 nested dynamic routes, entity CRUD, tag filtering, custom fields, icon picker
**Confidence:** HIGH

---

## Summary

Phase 3 introduces the core data model of the app: entity types and entities. The schema work is the highest-risk area — decisions made here directly constrain Phase 4 (Tiptap editor, wikilinks) and Phase 5 (entity relations). All patterns from Phase 2 extend cleanly: Server Actions with `useActionState`, IDOR-safe DB queries scoped to `worldId`, Drizzle ORM with `pg-core`.

The key architectural decision is **`text[]` for tags** (not a junction table) — the `arrayContains` helper in Drizzle 0.45.2 is confirmed available and generates the correct PostgreSQL `@>` operator. A GIN index makes filtering fast. JSONB is used for both `customFieldsSchema` (on entity types) and `customFields`/`content` (on entities) — Drizzle's `.$type<T>()` method enforces TypeScript shapes at the boundary.

Seeding built-in types must happen inside a `db.transaction()` call in `createWorldAction` — atomicity is required so a world never exists without its 5 types.

**Primary recommendation:** Add `entities` table with `text[]` tags and JSONB `customFields`/`content`. Extend `entityTypes` with `customFieldsSchema` JSONB. Seed built-in types transactionally in `createWorldAction`. Use `ilike` for name search in Phase 3 (tsvector deferred to Phase 5+).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Entity list (per type) | API / Backend (RSC) | — | Auth-gated, world-scoped DB query |
| Entity CRUD mutations | API / Backend (Server Action) | — | DB writes need server-side auth |
| Entity form UI | Browser / Client | RSC page wrapper | `useActionState` requires `'use client'` |
| Tag filter UI | Browser / Client | — | Local filter state, no server round-trip needed if tags pre-loaded |
| Name search | API / Backend (RSC) | — | Queried via URL search param, re-fetched per request |
| Entity type management | API / Backend (Server Action + RSC) | Browser / Client (dialog) | Same pattern as world CRUD |
| Icon picker | Browser / Client | — | Pure UI selection, no server involvement |
| Slug generation on rename | API / Backend (Server Action) | — | Must query DB for uniqueness |
| Custom field form rendering | Browser / Client | — | Dynamic field list driven by `customFieldsSchema` from RSC props |
| Built-in type seeding | API / Backend (Server Action) | — | Runs inside `createWorldAction` transaction |
| World-scoped routing | Frontend Server (Next.js) | — | Nested `[slug]/[type-slug]/[entity-slug]` layout chain |

---

## 1. Schema Design

### 1.1 `entities` Table

```typescript
// src/lib/db/schema.ts — add to Phase 3 migration (0003_*)

import {
  pgTable, uuid, text, boolean, timestamp, unique,
  jsonb, index
} from "drizzle-orm/pg-core";

// Custom field schema type — defines available fields on an entity type
export type CustomFieldDefinition = {
  name: string;       // machine-readable key, e.g. "age"
  label: string;      // display label, e.g. "Age"
  type: "text" | "textarea" | "number" | "boolean";
  required: boolean;
};

export type CustomFieldsSchema = {
  fields: CustomFieldDefinition[];
};

// Custom field values stored on an entity
export type CustomFieldValues = Record<string, string | number | boolean | null>;

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
    // Slug unique per world — stable URL, regenerated on rename
    // UUID (id) is the stable wikilink key; slug is just the URL segment
    slug: text("slug").notNull(),
    // Phase 4: Tiptap Prosemirror JSON document stored as JSONB
    content: jsonb("content"),
    // Free-form tags — text[] with GIN index for arrayContains queries
    tags: text("tags").array().default([]).notNull(),
    // JSONB values matching the entity type's customFieldsSchema
    customFields: jsonb("custom_fields")
      .$type<CustomFieldValues>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Slug unique per world (not globally) — enforced at DB level
    worldSlugUnique: unique("entities_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
    // GIN index on tags array — required for efficient arrayContains / arrayOverlaps
    tagsGinIdx: index("entities_tags_gin_idx")
      .using("gin")
      .on(table.tags),
  })
);

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

### 1.2 `entityTypes` — Add `customFieldsSchema` Column

```typescript
// Extend the existing entityTypes table definition:

export const entityTypes = pgTable(
  "entity_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    icon: text("icon"),
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    // Defines the custom fields available on entities of this type
    customFieldsSchema: jsonb("custom_fields_schema")
      .$type<CustomFieldsSchema>()
      .default({ fields: [] })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    worldSlugUnique: unique("entity_types_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
);
```

### 1.3 Schema Design Trade-offs

**`tags`: `text[]` vs junction table**

| Criterion | `text[]` column | Junction table |
|-----------|----------------|----------------|
| Query simplicity | `arrayContains(entities.tags, ['hero'])` | Two-table JOIN |
| Tag metadata (color, description) | Not possible | Possible |
| Rename a tag across all entities | Raw SQL UPDATE with unnest | Single row UPDATE |
| Drizzle support | `arrayContains`, `arrayOverlaps` confirmed in v0.45.2 | Standard join |
| GIN index | Yes — fast `@>` queries | B-tree on FK |
| Phase 4/5 tag query | `arrayContains` or `arrayOverlaps` covers all UAT cases | Over-engineered for UAT |

**Recommendation: `text[]` column.** UAT-10 requires tag filtering, not tag management. Tags in this context are labels on entities, not first-class objects. A junction table would add schema complexity with no UAT payoff. Add GIN index from day one.

**`customFields`: JSONB vs typed columns**

Custom fields are user-defined at runtime — they cannot be modelled as schema columns. JSONB is the only viable approach. Drizzle's `.$type<T>()` prevents accidental writes of wrong shapes at the TypeScript level. Zod validation in the Server Action provides runtime safety.

**`content` JSONB for Phase 4**

The `content` column is `nullable` in Phase 3 — entities are created without editor content. Phase 4 will write Tiptap's Prosemirror JSON here. Adding it now avoids a disruptive migration mid-phase. Phase 3 code must not read or write this column.

**`onDelete: "restrict"` on `entityTypeId`**

Use `restrict` (not `cascade`) so deleting an entity type fails if entities exist. This forces the user to delete or re-assign entities first — prevents silent data loss.

---

## 2. Seeding Built-in Entity Types

### 2.1 The Five Built-in Types

```typescript
// src/lib/constants/entity-types.ts

export const BUILT_IN_ENTITY_TYPES = [
  { name: "Character", slug: "character", icon: "user" },
  { name: "Location",  slug: "location",  icon: "map-pin" },
  { name: "Faction",   slug: "faction",   icon: "shield" },
  { name: "Item",      slug: "item",      icon: "package" },
  { name: "Event",     slug: "event",     icon: "calendar" },
] as const;
```

### 2.2 Recommendation: Seed Inside `createWorldAction` in a Transaction

**Option A — In `createWorldAction`:** ✅ Recommended
**Option B — DB trigger:** ❌ Avoid — adds DDL complexity, invisible to Drizzle schema, hard to test
**Option C — Separate seed action:** ❌ Avoid — creates window where world exists with no types

Rationale: The world and its built-in types are an atomic unit. If the seed insert fails, the world insert should roll back. Drizzle supports `db.transaction()` for this.

```typescript
// src/lib/actions/worlds.ts — updated createWorldAction (relevant section)

import { db } from "@/lib/db";
import { worlds, entityTypes } from "@/lib/db/schema";
import { BUILT_IN_ENTITY_TYPES } from "@/lib/constants/entity-types";

// Inside createWorldAction, replace:
//   await db.insert(worlds).values({ ... });
// With:

const [newWorld] = await db.transaction(async (tx) => {
  const [world] = await tx
    .insert(worlds)
    .values({ name, description: description ?? null, slug, ownerId: session.user.id, isPublic: false })
    .returning({ id: worlds.id, slug: worlds.slug });

  await tx.insert(entityTypes).values(
    BUILT_IN_ENTITY_TYPES.map((t) => ({
      worldId: world.id,
      name: t.name,
      slug: t.slug,
      icon: t.icon,
      isBuiltIn: true,
      customFieldsSchema: { fields: [] },
    }))
  );

  return [world];
});

redirect(`/worlds/${newWorld.slug}`);
```

**Why `.returning()`:** The world `id` is generated by the DB (`gen_random_uuid()`). Use `.returning()` to get it back within the transaction so the seed insert can reference it immediately — no second round-trip needed.

---

## 3. Slug Stability for Wikilinks

### 3.1 Design Contract

- **UUID `id`** = stable wikilink key. Phase 4 wikilink nodes store `{ id: UUID, label: string }`.
- **`slug`** = URL segment. Regenerated on rename (UAT-12 confirms this). Changing the slug does not break wikilinks because wikilinks resolve by UUID, not slug.
- **Stability guarantee**: The entity page at `/worlds/[slug]/entities/[type-slug]/[entity-slug]` resolves the entity by world + entity UUID in a lookup table, or by world + entity slug. If slug-only routing is used, a redirect from old-slug → new-slug is needed. Recommendation: resolve entity pages by `id` internally, use slug as display-only URL segment (see route structure section for pattern).

### 3.2 Slug Generation — Same Pattern as Worlds, Scoped to `worldId`

```typescript
// src/lib/actions/entities.ts

async function generateUniqueEntitySlug(
  name: string,
  worldId: string,
  excludeId?: string  // pass current entity id on rename to exclude self
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });

  const existing = await db
    .select({ slug: entities.slug })
    .from(entities)
    .where(
      and(
        eq(entities.worldId, worldId),
        like(entities.slug, `${base}%`)
      )
    );

  // Exclude self when renaming (current slug should not count as "taken")
  const others = excludeId
    ? existing.filter((r) => /* can't filter by id here — filter after */)  // see note
    : existing;

  if (!others.some((r) => r.slug === base)) return base;

  let i = 2;
  while (others.some((r) => r.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}
```

**Simpler rename approach:** On rename, query slugs where `worldId = X AND id != entityId AND slug LIKE base%`. The `excludeId` complicates the query slightly. Alternative: generate the new slug ignoring the entity's own current slug, which is fine because the entity will be assigned the new slug anyway. If the entity's current slug equals the new base, that's fine — it'll get assigned the same slug (no rename needed in DB for the slug).

```typescript
// Cleaner: exclude self directly in the where clause
const existing = await db
  .select({ slug: entities.slug })
  .from(entities)
  .where(
    and(
      eq(entities.worldId, worldId),
      ne(entities.id, entityId),  // ne = not equal, from drizzle-orm
      like(entities.slug, `${base}%`)
    )
  );
```

**`ne` is available** in `drizzle-orm` alongside `eq`, `and`, `like`.

---

## 4. Tags Implementation

### 4.1 Drizzle `text[]` Column + GIN Index

```typescript
// Column definition (already shown in schema above):
tags: text("tags").array().default([]).notNull(),

// GIN index (critical — without this, array queries are full-table scans):
tagsGinIdx: index("entities_tags_gin_idx").using("gin").on(table.tags),
```

### 4.2 Filter Queries

```typescript
import { arrayContains, arrayOverlaps, eq, and, ilike } from "drizzle-orm";

// Entities tagged with EXACTLY this tag (single tag filter):
.where(arrayContains(entities.tags, [selectedTag]))
// Generates: WHERE "tags" @> ARRAY['hero']

// Entities tagged with ANY of these tags (multi-tag OR filter):
.where(arrayOverlaps(entities.tags, selectedTags))
// Generates: WHERE "tags" && ARRAY['hero','villain']
```

**Note:** `arrayContains(col, arr)` checks that `col @> arr` (column contains all elements in arr). `arrayOverlaps(col, arr)` checks `col && arr` (column has any element from arr). For UAT-10 (filter by tag), `arrayContains` with a single-element array is correct.

### 4.3 Tag Input UI

Tags are entered as free-form text. Use a simple comma-separated input that splits on comma and trims whitespace, or a `Badge`-based tag input built with `Input` (no additional component needed). Store tags as lowercase, trimmed strings before insert.

```typescript
// Normalize before write:
const normalizedTags = rawTags
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);
```

---

## 5. Custom Fields

### 5.1 Schema Shape

```typescript
// The definition stored on entity_types.customFieldsSchema:
type CustomFieldDefinition = {
  name: string;        // camelCase key used as JSON key on entity, e.g. "hairColor"
  label: string;       // Human label, e.g. "Hair Color"
  type: "text" | "textarea" | "number" | "boolean";
  required: boolean;
};

type CustomFieldsSchema = {
  fields: CustomFieldDefinition[];
};

// Example:
{
  fields: [
    { name: "age", label: "Age", type: "number", required: false },
    { name: "affiliation", label: "Affiliation", type: "text", required: false },
  ]
}

// The values stored on entities.customFields:
type CustomFieldValues = Record<string, string | number | boolean | null>;

// Example:
{ age: 34, affiliation: "The Dawnguard" }
```

### 5.2 Dynamic Form Rendering (UAT-13)

```typescript
// src/components/entities/custom-fields-form.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CustomFieldDefinition } from "@/lib/db/schema";

interface CustomFieldsFormProps {
  fields: CustomFieldDefinition[];
  values: Record<string, string | number | boolean | null>;
  onChange: (name: string, value: string | number | boolean | null) => void;
}

export function CustomFieldsForm({ fields, values, onChange }: CustomFieldsFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={`cf-${field.name}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.type === "text" && (
            <Input
              id={`cf-${field.name}`}
              name={`cf_${field.name}`}
              defaultValue={(values[field.name] as string) ?? ""}
            />
          )}
          {field.type === "textarea" && (
            <Textarea
              id={`cf-${field.name}`}
              name={`cf_${field.name}`}
              defaultValue={(values[field.name] as string) ?? ""}
            />
          )}
          {field.type === "number" && (
            <Input
              id={`cf-${field.name}`}
              name={`cf_${field.name}`}
              type="number"
              defaultValue={(values[field.name] as number) ?? ""}
            />
          )}
          {field.type === "boolean" && (
            <Switch
              id={`cf-${field.name}`}
              name={`cf_${field.name}`}
              defaultChecked={Boolean(values[field.name])}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Custom field extraction in Server Action:**

Custom fields come in as `cf_fieldName` form keys. Extract them and validate with Zod:

```typescript
// In createEntityAction / updateEntityAction:
const customFields: CustomFieldValues = {};
for (const field of entityType.customFieldsSchema.fields) {
  const raw = formData.get(`cf_${field.name}`);
  if (field.type === "number") customFields[field.name] = raw ? Number(raw) : null;
  else if (field.type === "boolean") customFields[field.name] = raw === "on";
  else customFields[field.name] = raw ? String(raw) : null;
}
```

Zod validation of custom fields: Build a dynamic Zod schema from `customFieldsSchema.fields` for server-side validation.

---

## 6. Entity Listing + Filtering + Search

### 6.1 URL-Driven Filtering Pattern

Filtering state lives in the URL via search params (`?tag=hero&q=ald`). This makes the entity list an RSC (no client state needed for data) — filtering re-fetches the page.

```
/worlds/[slug]/entities/[type-slug]?tag=hero&q=aldric
```

### 6.2 Combined Drizzle Query

```typescript
// src/lib/db/queries/entities.ts

import { db } from "@/lib/db";
import { entities, entityTypes, worlds } from "@/lib/db/schema";
import { eq, and, ilike, arrayContains, desc } from "drizzle-orm";

interface GetEntitiesOptions {
  worldId: string;
  entityTypeId: string;
  search?: string;  // name ilike search
  tag?: string;     // single tag filter
}

export async function getEntitiesByType({
  worldId,
  entityTypeId,
  search,
  tag,
}: GetEntitiesOptions) {
  const conditions = [
    eq(entities.worldId, worldId),
    eq(entities.entityTypeId, entityTypeId),
  ];

  if (search) {
    conditions.push(ilike(entities.name, `%${search}%`));
  }

  if (tag) {
    conditions.push(arrayContains(entities.tags, [tag]));
  }

  return db
    .select()
    .from(entities)
    .where(and(...conditions))
    .orderBy(desc(entities.updatedAt));
}
```

### 6.3 Name Search: `ilike` vs `tsvector`

| Approach | Pros | Cons |
|----------|------|------|
| `ilike '%term%'` | Zero setup, works immediately | Full table scan without pg_trgm index; slow at scale |
| `tsvector` + `tsquery` | Fast, handles stemming, ranking | Requires `to_tsvector` generated column + GIN index; more complex |
| `pg_trgm` + GIN | Fast `ILIKE` equivalent | Requires `pg_trgm` extension |

**Recommendation for Phase 3:** Use `ilike`. Entity counts per world will be low (hundreds, not millions) for a worldbuilding app. Add a note to Phase 5 to add `pg_trgm` extension and `ILIKE` GIN index if search latency becomes a concern. tsvector is over-engineered for UAT-11.

### 6.4 Resolving Entity Type by Slug (World-Scoped)

Entity type and entity slugs are unique per world, not globally. Every query must scope by `worldId`:

```typescript
// src/lib/db/queries/entity-types.ts

export async function getEntityTypeBySlug(worldId: string, typeSlug: string) {
  const [entityType] = await db
    .select()
    .from(entityTypes)
    .where(
      and(eq(entityTypes.worldId, worldId), eq(entityTypes.slug, typeSlug))
    )
    .limit(1);
  return entityType ?? null;
}

export async function getEntityTypesByWorld(worldId: string) {
  return db
    .select()
    .from(entityTypes)
    .from(entityTypes)
    .where(eq(entityTypes.worldId, worldId))
    .orderBy(entityTypes.isBuiltIn, entityTypes.name);
  // Built-in types first (true > false in DESC), then alphabetical
  // Use: .orderBy(desc(entityTypes.isBuiltIn), asc(entityTypes.name))
}
```

---

## 7. New shadcn/ui Components Needed

### Currently Installed

`button`, `input`, `label`, `textarea`, `card`, `dialog`, `alert-dialog`, `badge`, `dropdown-menu`, `separator`, `switch`

### Phase 3 Requirements

| Component | Radix Primitive | Purpose | Install Command |
|-----------|----------------|---------|----------------|
| `select` | `@radix-ui/react-select@2.3.1` | Custom field type dropdown (text/textarea/number/boolean) | `npx shadcn@latest add select` |
| `tabs` | `@radix-ui/react-tabs@1.1.15` | Entity type tab navigation on entity list | `npx shadcn@latest add tabs` |
| `scroll-area` | `@radix-ui/react-scroll-area@1.2.12` | Scrollable icon picker grid | `npx shadcn@latest add scroll-area` |
| `tooltip` | `@radix-ui/react-tooltip@1.2.10` | Icon name display on hover in picker | `npx shadcn@latest add tooltip` |
| `popover` | `@radix-ui/react-popover@1.1.17` | Tag filter popover, icon picker trigger | `npx shadcn@latest add popover` |

**`command` (combobox):** Not needed in Phase 3 — the icon picker is a curated grid (see §8), not a searchable combobox. Defer `command` to Phase 5 if entity-to-entity linking needs an autocomplete picker.

**`checkbox`:** Not needed — tag filtering uses Badge-style toggle buttons, not checkboxes.

**`tabs` alternative:** If entity type navigation uses URL segments (recommended — see §9), `tabs` renders as nav links styled to look like tabs. This is cleaner than Radix Tabs (which use hidden panels) for URL-driven navigation.

---

## 8. Icon Selection for Entity Types

### 8.1 Approach: Hardcoded Curated Subset in a Popover Grid

With 5,948 icons in lucide-react@1.21.0, an uncurated picker is unusable. The correct approach is a hardcoded curated list of ~40 icons relevant to worldbuilding, rendered in a `Popover` + `ScrollArea` grid.

**Do not install** any additional icon picker library — they are either unmaintained or add unnecessary bundle weight for a 40-icon subset.

### 8.2 Curated Icon List

```typescript
// src/lib/constants/icon-picker.ts

export const ICON_PICKER_OPTIONS = [
  // People & Characters
  "user", "users", "user-round", "skull", "crown", "sword",
  // Places
  "map-pin", "map", "castle", "home", "mountain", "tent",
  // Groups & Factions
  "shield", "flag", "swords", "handshake", "network",
  // Items & Objects
  "package", "gem", "scroll", "wand", "key", "book",
  // Events & Time
  "calendar", "clock", "zap", "flame", "star", "moon",
  // Nature
  "tree-pine", "droplets", "cloud", "wind",
  // Misc
  "circle", "triangle", "square", "diamond", "help-circle",
] as const;

export type IconName = typeof ICON_PICKER_OPTIONS[number];
```

### 8.3 Dynamic Icon Rendering

Import icons by name at runtime using Lucide's dynamic approach:

```typescript
// src/components/ui/lucide-icon.tsx
"use client";

import { icons } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface LucideIconProps extends LucideProps {
  name: string;
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon {...props} />;
}
```

**Tree-shaking note:** Importing `icons` from `lucide-react` imports all icons. For Phase 3 this is acceptable — lucide-react already imports every icon in use across the app anyway. If bundle size becomes a concern in a later phase, switch to `lucide-react/dynamic` (lazy imports by name).

### 8.4 Icon Picker Component Sketch

```typescript
// src/components/entity-types/icon-picker.tsx
"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { ICON_PICKER_OPTIONS } from "@/lib/constants/icon-picker";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          {value ? (
            <LucideIcon name={value} size={18} />
          ) : (
            <span className="text-muted-foreground text-xs">?</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <ScrollArea className="h-48">
          <div className="grid grid-cols-7 gap-1">
            {ICON_PICKER_OPTIONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                title={iconName}
                onClick={() => { onChange(iconName); setOpen(false); }}
                className={cn(
                  "p-1.5 rounded hover:bg-muted flex items-center justify-center",
                  value === iconName && "bg-muted ring-1 ring-ring"
                )}
              >
                <LucideIcon name={iconName} size={16} />
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

`type="button"` on every button inside the picker is **critical** — without it, clicking an icon submits the nearest `<form>`.

---

## 9. Route Structure

### 9.1 Full Route Tree Under `/worlds/[slug]/`

```
src/app/(worlds)/worlds/[slug]/
├── layout.tsx                          # ← EXISTS: auth + ownership check
├── page.tsx                            # ← EXISTS: world detail
├── entities/
│   ├── page.tsx                        # redirect to first entity type
│   └── [type-slug]/
│       ├── page.tsx                    # entity list for this type
│       └── [entity-slug]/
│           └── page.tsx               # entity detail (Phase 3: read-only; Phase 4: editor)
└── entity-types/
    └── page.tsx                        # entity type management (create custom type, edit icons)
```

**No additional layouts in `entities/` or `[type-slug]/`** — the world layout at `worlds/[slug]/layout.tsx` is sufficient. Avoid nested layouts unless you need a persistent shell per sub-route (not needed here).

### 9.2 Param Types in Next.js 16 — All Async

In Next.js 16, **all dynamic params are `Promise<{...}>`**. This is already established in the existing layout.tsx and page.tsx. Every new page in this phase must follow the same pattern:

```typescript
// Correct for Next.js 16 — await params at the top
export default async function EntityListPage({
  params,
}: {
  params: Promise<{ slug: string; "type-slug": string }>;
}) {
  const { slug, "type-slug": typeSlug } = await params;
  // ...
}
```

**Pitfall:** Next.js 16 does NOT spread params across the layout chain for you — each page/layout receives only its own segment params. The `entities/[type-slug]/page.tsx` receives `{ slug, "type-slug" }` (both segments). This works because params includes all ancestor dynamic segments.

### 9.3 Entities Index Redirect

```typescript
// src/app/(worlds)/worlds/[slug]/entities/page.tsx

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";

export const dynamic = "force-dynamic";

export default async function EntitiesIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const types = await getEntityTypesByWorld(world.id);
  const first = types[0];

  if (first) redirect(`/worlds/${slug}/entities/${first.slug}`);
  // Fallback: no types (shouldn't happen after Phase 3 seeding)
  return <div>No entity types found.</div>;
}
```

### 9.4 Sidebar Update

The sidebar world context block (currently showing "Entities (Phase 3)") should be upgraded to list entity types as nav links. The sidebar already receives `worldSlug` from `usePathname()`. In Phase 3, the sidebar needs to know entity types — options:

- **Pass entity types as props from the world layout:** The world layout is an RSC that already queries the world. It can fetch entity types and pass them to Sidebar. But Sidebar is `"use client"` — this works via props.
- **Fetch entity types in a client hook via an API route:** More complex, not needed.

**Recommendation:** Fetch entity types in the world layout RSC and pass as a prop to Sidebar. Requires changing Sidebar's interface to accept `entityTypes?: EntityType[]`. This is a clean server → client data flow.

---

## 10. Common Pitfalls

### Pitfall 1: JSONB `.$type<T>()` Is TypeScript-Only — No Runtime Validation

**What goes wrong:** Drizzle's `.$type<T>()` annotation on a `jsonb()` column tells TypeScript the shape, but Drizzle does not validate it at write time. Writing a malformed object bypasses the type annotation at runtime.

**Prevention:** Always validate JSONB writes through a Zod schema before inserting:

```typescript
const CustomFieldValuesSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

// In the Server Action:
const parsedCustomFields = CustomFieldValuesSchema.safeParse(rawCustomFields);
if (!parsedCustomFields.success) return { errors: { customFields: ["Invalid"] } };
```

### Pitfall 2: Async Params in Deeply Nested Next.js 16 Pages

**What goes wrong:** Destructuring `params` synchronously (no `await`) returns a Promise object, not the param values. This causes `undefined` slug and silently broken queries.

**Prevention:** Always `const { slug } = await params` at the top of every page component. This is already established in the codebase — carry the pattern forward.

### Pitfall 3: GIN Index Missing from Migration

**What goes wrong:** `arrayContains(entities.tags, [tag])` works correctly but runs a seq scan without a GIN index. For worldbuilding apps this is low-risk early on, but the index should be created from day one to avoid a painful migration later.

**Prevention:** Add `index("entities_tags_gin_idx").using("gin").on(table.tags)` in the schema definition **before** running `drizzle-kit generate`. Drizzle 0.45.2 correctly emits `CREATE INDEX USING gin` in the migration SQL.

```sql
-- Expected in 0003 migration:
CREATE INDEX "entities_tags_gin_idx" ON "entities" USING gin ("tags");
```

### Pitfall 4: `arrayContains` vs `arrayOverlaps` Semantics

**What goes wrong:** Using `arrayContains(entities.tags, tags)` when you mean "any of these tags" returns only entities that have ALL selected tags (set intersection, not union).

**Prevention:**
- Single tag filter → `arrayContains(entities.tags, [tag])` (entity has this tag)
- "Any of these tags" → `arrayOverlaps(entities.tags, selectedTags)`
- "All of these tags" → `arrayContains(entities.tags, selectedTags)`

For UAT-10 (filter by tag), a single selected tag uses `arrayContains`.

### Pitfall 5: `onDelete: "restrict"` Requires Explicit Error Handling

**What goes wrong:** When a user tries to delete an entity type that has entities, the DB raises a foreign key violation. Without catching this, the Server Action throws an unhandled error and the user sees a 500.

**Prevention:** Wrap the entity type delete in a try/catch:

```typescript
try {
  await db.delete(entityTypes).where(/* ... */);
} catch (err) {
  // Drizzle wraps FK violations in DrizzleQueryError
  if (String(err).includes("restrict")) {
    return { errors: { _: ["Delete all entities of this type first."] } };
  }
  throw err;
}
```

### Pitfall 6: `type="button"` in Icon Picker

**What goes wrong:** Any `<button>` inside a `<form>` without `type="button"` defaults to `type="submit"`. Clicking an icon in the picker submits the entity type form.

**Prevention:** Every button element in the icon picker (and any other non-submit button inside a form) must have `type="button"` explicitly.

### Pitfall 7: Slug Collision on Rename with Own Current Slug

**What goes wrong:** When renaming an entity, the current slug is in the DB. Without excluding the entity's own row, `generateUniqueEntitySlug("Aldric", worldId)` might return `"aldric-2"` even when `"aldric"` is available (because the entity itself currently holds it).

**Prevention:** Pass `entityId` to the slug generation function and use `ne(entities.id, entityId)` in the WHERE clause (as shown in §3.2).

### Pitfall 8: JSONB Default `{}` vs `null` in Drizzle

**What goes wrong:** `jsonb("custom_fields").default({})` in Drizzle schema does NOT inject `{}` at the SQL level by default — it sets a JS-level default for inserts via Drizzle. If you insert a row without Drizzle (direct SQL, migrations, seeds), the column may be `null`.

**Prevention:** Add `.notNull()` AND set the PostgreSQL default explicitly in the migration:

```sql
-- In the generated migration, verify:
"custom_fields" jsonb DEFAULT '{}' NOT NULL
-- Drizzle 0.45.2 correctly emits this for .default({}).notNull()
```

After running `drizzle-kit generate`, inspect the SQL to confirm the default is emitted.

### Pitfall 9: `orderBy` with Mixed `isBuiltIn` + Name

**What goes wrong:** `orderBy(entities.isBuiltIn, entityTypes.name)` sorts `false` before `true` (ASC boolean). Built-in types should appear first.

**Prevention:** Use `desc(entityTypes.isBuiltIn)` for the first sort key so `true` (built-in) comes first:

```typescript
import { desc, asc } from "drizzle-orm";
.orderBy(desc(entityTypes.isBuiltIn), asc(entityTypes.name))
```

### Pitfall 10: Stale `params` Reference in World Layout After Entity Type Seed

The world layout at `/worlds/[slug]/layout.tsx` currently checks session + world ownership but does NOT pass `world` down. Phase 3 pages need `world.id` to query entity types. Each page re-queries `getWorldBySlug(slug, ownerId)` — this is correct (no shared layout prop needed) but means one extra DB call per page render. Acceptable for Phase 3; can optimize with React cache() in Phase 5 if needed.

---

## Package Legitimacy Audit

Phase 3 installs no new npm packages. All new shadcn components (`select`, `tabs`, `scroll-area`, `tooltip`, `popover`) are installed via `npx shadcn@latest add <component>` — these copy component source into `src/components/ui/` and add their Radix UI primitives to `package.json`. The Radix UI packages are well-established (2-4 years old, tens of millions of weekly downloads).

| Package | Registry | Disposition |
|---------|----------|-------------|
| `@radix-ui/react-select` | npm | Approved — official Radix primitive, ~15M weekly downloads |
| `@radix-ui/react-tabs` | npm | Approved — official Radix primitive |
| `@radix-ui/react-scroll-area` | npm | Approved — official Radix primitive |
| `@radix-ui/react-tooltip` | npm | Approved — official Radix primitive |
| `@radix-ui/react-popover` | npm | Approved — official Radix primitive |

No slopcheck concerns.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `drizzle-kit generate` | Migration 0003 | ✓ | 0.31.10 | — |
| `drizzle-kit migrate` | Apply migration | ✓ | 0.31.10 | — |
| Neon PostgreSQL | All DB queries | ✓ (env var) | — | — |
| `lucide-react` icons | Icon picker | ✓ | 1.21.0 (5,948 icons) | — |
| `slugify` | Entity slug generation | ✓ | 1.6.9 | — |

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|------|-------|--------|
| Schema design | HIGH | Drizzle `jsonb()`, `.array()`, `arrayContains`, `arrayOverlaps` all verified in installed v0.45.2 |
| Seeding pattern | HIGH | Drizzle `db.transaction()` + `.returning()` confirmed in pg-core |
| Tags `text[]` approach | HIGH | `arrayContains` / `arrayOverlaps` confirmed available; GIN index syntax verified |
| Custom fields JSONB | HIGH | `.$type<T>()` confirmed; Zod validation pattern established from Phase 2 |
| Route structure | HIGH | Async params pattern already established in codebase; Next.js 16.2.9 confirmed |
| Icon picker | HIGH | lucide-react `icons` export confirmed (5,948 icons); curated list approach is pragmatic |
| Search (`ilike`) | HIGH | `ilike` confirmed in drizzle-orm exports |
| shadcn components | HIGH | Radix primitive versions confirmed via `npm view` |

**Research date:** 2026-06-24
**Valid until:** 2026-07-24 (stable stack, no fast-moving dependencies)
