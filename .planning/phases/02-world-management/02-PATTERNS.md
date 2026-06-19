# Phase 2: World Management - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** 14 new/modified files
**Analogs found:** 12 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/db/schema.ts` | model | CRUD | `src/lib/db/schema.ts` (self — modify) | exact |
| `src/lib/db/queries/worlds.ts` | utility | CRUD | `src/lib/db/index.ts` + schema.ts | role-match |
| `src/lib/validations/worlds.ts` | utility | transform | `src/lib/utils.ts` | partial |
| `src/lib/actions/worlds.ts` | service | CRUD | `src/app/api/auth/[...all]/route.ts` (server fn pattern) | partial |
| `src/app/(app)/dashboard/page.tsx` | page (RSC) | request-response | `src/app/(app)/dashboard/page.tsx` (self — modify) | exact |
| `src/app/(worlds)/worlds/[slug]/layout.tsx` | layout (RSC) | request-response | `src/app/(app)/layout.tsx` | exact |
| `src/app/(worlds)/worlds/[slug]/page.tsx` | page (RSC) | request-response | `src/app/(app)/dashboard/page.tsx` | role-match |
| `src/proxy.ts` | middleware | request-response | `src/proxy.ts` (self — modify) | exact |
| `src/components/worlds/world-card.tsx` | component | request-response | `src/components/layout/sidebar.tsx` | role-match |
| `src/components/worlds/world-form.tsx` | component | request-response | `src/app/(auth)/login/page.tsx` | role-match |
| `src/components/worlds/create-world-dialog.tsx` | component | request-response | `src/app/(auth)/login/page.tsx` | role-match |
| `src/components/worlds/edit-world-dialog.tsx` | component | request-response | `src/app/(auth)/login/page.tsx` | role-match |
| `src/components/worlds/delete-world-dialog.tsx` | component | event-driven | `src/app/(auth)/login/page.tsx` | partial |
| `src/components/worlds/privacy-toggle.tsx` | component | event-driven | `src/components/layout/sidebar.tsx` | partial |

---

## Pattern Assignments

### `src/lib/db/schema.ts` (model — modify existing)

**Analog:** `src/lib/db/schema.ts` (self)

**Current worlds table definition** (lines 17–30):
```typescript
export const worlds = pgTable("worlds", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),   // <-- REMOVE .unique() here
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Composite unique constraint pattern to copy from `entityTypes`** (lines 34–56):
```typescript
// entityTypes uses this exact two-argument table-level unique pattern.
// Copy this shape for worlds — swap out column names.
export const entityTypes = pgTable(
  "entity_types",
  {
    // ... columns ...
  },
  (table) => ({
    worldSlugUnique: unique("entity_types_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
)
```

**Target worlds definition after migration:**
```typescript
// Add `unique` to imports (already present for entityTypes use)
import { pgTable, uuid, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";

export const worlds = pgTable(
  "worlds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),   // .unique() removed
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    ownerSlugUnique: unique("worlds_owner_id_slug_unique").on(
      table.ownerId,
      table.slug
    ),
  })
);
```

**Exports block to extend** (lines 59–68): Add `World`, `NewWorld` type exports — already present, no change needed.

---

### `src/lib/db/queries/worlds.ts` (utility, CRUD)

**Analog:** `src/lib/db/index.ts` + `src/lib/db/schema.ts`

**DB import pattern** (from `src/lib/db/index.ts`, lines 1–7):
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Query file import pattern** (copy this structure):
```typescript
import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and, desc, like } from "drizzle-orm";
```

**Select query pattern** (from schema + Drizzle API verified in research):
```typescript
export async function getWorldsByOwner(ownerId: string) {
  return db
    .select()
    .from(worlds)
    .where(eq(worlds.ownerId, ownerId))
    .orderBy(desc(worlds.updatedAt));
}

export async function getWorldBySlug(slug: string, ownerId: string) {
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.slug, slug), eq(worlds.ownerId, ownerId)))
    .limit(1);
  return world ?? null;
}
```

---

### `src/lib/validations/worlds.ts` (utility, transform)

**Analog:** no direct analog — new pattern. Use RESEARCH.md Zod v4 code examples.

**Zod v4 schema pattern** (from RESEARCH.md Pattern 1):
```typescript
import { z } from "zod";

// CRITICAL: Zod v4 uses { error: '...' } not { message: '...' }
export const CreateWorldSchema = z.object({
  name: z.string().min(1, { error: "World name is required." }).max(100, { error: "Name must be 100 characters or fewer." }),
  description: z.string().max(500, { error: "Description must be 500 characters or fewer." }).optional(),
});

export const UpdateWorldSchema = z.object({
  name: z.string().min(1, { error: "World name is required." }).max(100, { error: "Name must be 100 characters or fewer." }),
  description: z.string().max(500, { error: "Description must be 500 characters or fewer." }).optional(),
});

export type CreateWorldInput = z.infer<typeof CreateWorldSchema>;
export type UpdateWorldInput = z.infer<typeof UpdateWorldSchema>;
```

**State type pattern** (used by `useActionState`):
```typescript
export type WorldActionState = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string;
};
```

---

### `src/lib/actions/worlds.ts` (service, CRUD — Server Actions)

**Analog:** `src/app/(app)/layout.tsx` (auth pattern), `src/app/(app)/dashboard/page.tsx` (session fetch)

**Server-side auth fetch pattern** (from `src/app/(app)/layout.tsx`, lines 1–13):
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Inside any async server function:
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  redirect("/login");
}
```

**File header / directive pattern:**
```typescript
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateWorldSchema, UpdateWorldSchema, WorldActionState } from "@/lib/validations/worlds";
```

**Auth guard + Zod safeParse pattern** (RESEARCH.md Pattern 1, verified against installed packages):
```typescript
export async function createWorldAction(
  prevState: WorldActionState,
  formData: FormData
): Promise<WorldActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const validated = CreateWorldSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // ... slug generation + db.insert + updateTag + redirect
}
```

**IDOR-safe delete pattern** (from RESEARCH.md Delete World Action, always scope to ownerId):
```typescript
await db
  .delete(worlds)
  .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));
```

**Cache invalidation** (Next.js 16 — `updateTag`, NOT `revalidateTag`):
```typescript
// After every mutation:
updateTag(`worlds-${session.user.id}`);
// After world-specific mutation (edit, delete, privacy toggle):
updateTag(`world-${worldId}`);
```

---

### `src/app/(app)/dashboard/page.tsx` (page RSC — modify existing)

**Analog:** `src/app/(app)/dashboard/page.tsx` (self)

**Current full file** (lines 1–22):
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="p-8">
      <div className="mb-1">
        <p className="text-sm text-muted-foreground">
          {session?.user.name} · {session?.user.email}
        </p>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Your Worlds
      </h1>
      <p className="text-muted-foreground text-sm">
        You don&apos;t have any worlds yet. World management comes in Phase 2.
      </p>
    </div>
  );
}
```

**Heading + layout pattern to preserve** (lines 8–15):
```typescript
// Keep: p-8 padding, text-2xl font-semibold tracking-tight heading, text-sm text-muted-foreground secondary text
// Add: flex items-center justify-between on the header row, mb-6 below header
// Add: grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 for world card grid
// Add: CreateWorldDialog as the right-aligned CTA button in header row
```

---

### `src/app/(worlds)/worlds/[slug]/layout.tsx` (layout RSC)

**Analog:** `src/app/(app)/layout.tsx`

**Auth guard + children render pattern** (from `src/app/(app)/layout.tsx`, lines 1–23):
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

**Async params pattern** (Next.js 16 — CRITICAL, from RESEARCH.md Pattern 2):
```typescript
// params is a Promise in Next.js 16 — must await
export default async function WorldLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;  // required — sync access throws in Next.js 16
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // ... db query then notFound() if not owned
}
```

**404-not-403 pattern** (RESEARCH.md security — prevents world existence enumeration):
```typescript
import { notFound } from "next/navigation";
// Use notFound() (not redirect or 403) when world not found OR not owned:
if (!world) notFound();
```

---

### `src/app/(worlds)/worlds/[slug]/page.tsx` (page RSC)

**Analog:** `src/app/(app)/dashboard/page.tsx`

**Page structure pattern** (lines 8–21 of dashboard — carry forward spacing and typography):
```typescript
// p-8 page padding (same as dashboard)
// text-2xl font-semibold tracking-tight for world name heading
// text-sm text-muted-foreground for description + metadata
// flex items-center justify-between for header row with action buttons
```

**Async params pattern** (same as layout — Next.js 16 required):
```typescript
export default async function WorldPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

---

### `src/proxy.ts` (middleware — modify existing)

**Analog:** `src/proxy.ts` (self)

**Current protected paths pattern** (lines 17–21):
```typescript
// Protected paths: require authenticated session
if (!session && pathname.startsWith("/dashboard")) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Extension pattern — add `/worlds` protection:**
```typescript
// Add worlds route protection alongside dashboard:
const isProtected =
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/worlds");

if (!session && isProtected) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Matcher config to preserve** (lines 25–40 — do not change the matcher regex):
```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
```

---

### `src/components/worlds/world-card.tsx` (component, RSC-compatible)

**Analog:** `src/components/layout/sidebar.tsx` (closest component analog for structure + lucide icons)

**Icon import pattern** (from `src/components/layout/sidebar.tsx`, lines 3–8):
```typescript
import {
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
```

**Conditional className pattern** (sidebar lines 47–52 — use cn() for conditional classes):
```typescript
import { cn } from "@/lib/utils";

// Pattern for conditional classes:
className={cn(
  "base classes here",
  condition && "conditional class"
)}
```

**Component export pattern** (sidebar line 29 — named export, not default):
```typescript
export function WorldCard({ world }: { world: World }) {
  // ...
}
```

**shadcn Card + shadcn Badge usage** (no direct analog — copy from shadcn component API):
```typescript
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

---

### `src/components/worlds/world-form.tsx` (component, Client — useActionState)

**Analog:** `src/app/(auth)/login/page.tsx`

**Client directive + imports pattern** (login/page.tsx, lines 1–10):
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**Form field with label pattern** (login/page.tsx, lines 87–96):
```typescript
<div className="space-y-1.5">
  <Label htmlFor="name">World Name</Label>
  <Input
    id="name"
    name="name"
    type="text"
    placeholder="e.g. The Shattered Realm"
    autoFocus
  />
</div>
```

**Error display pattern** (login/page.tsx, lines 110–114):
```typescript
{error && (
  <p className="text-sm text-destructive">{error}</p>
)}
```

**useActionState pattern** (replaces `useState` + manual fetch — from RESEARCH.md Pattern 3):
```typescript
"use client";

import { useActionState } from "react";
import { WorldActionState } from "@/lib/validations/worlds";

// Replaces useState error/isLoading pattern from login page:
const [state, formAction, pending] = useActionState(action, initialState);

// Form uses action prop (not onSubmit):
<form action={formAction}>

// Per-field errors from Server Action state:
{state.errors?.name && (
  <p id="name-error" className="text-sm text-destructive mt-1">
    {state.errors.name[0]}
  </p>
)}

// Pending button state (replaces isLoading boolean):
<Button type="submit" disabled={pending}>
  {pending ? "Creating..." : "Create World"}
</Button>
```

---

### `src/components/worlds/create-world-dialog.tsx` (component, Client)

**Analog:** `src/app/(auth)/login/page.tsx` (dialog state management pattern)

**Client state for dialog open/close** (pattern from login page's `useState` usage, lines 16–18):
```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WorldForm } from "@/components/worlds/world-form";

export function CreateWorldDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus size={16} />
          Create World
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new world</DialogTitle>
          <DialogDescription>
            Give your world a name. A URL slug is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <WorldForm action={createWorldAction} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

---

### `src/components/worlds/edit-world-dialog.tsx` (component, Client)

**Analog:** `src/components/worlds/create-world-dialog.tsx` (same pattern, different props)

Same structure as CreateWorldDialog with:
- Props: `world: World` (pre-populated form values)
- DialogTitle: "Edit world"
- DialogDescription: "Update your world's name or description. The slug cannot be changed after creation."
- Button label: "Save Changes" / "Saving..."
- Action: `updateWorldAction` (bound with world id)

---

### `src/components/worlds/delete-world-dialog.tsx` (component, Client)

**Analog:** `src/app/(auth)/login/page.tsx` (loading state + error handling pattern)

**AlertDialog imports** (no existing analog — use shadcn AlertDialog API):
```typescript
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
```

**Pending state pattern** (from login/page.tsx, lines 132–134):
```typescript
// Copy pending disable + label change pattern:
<Button type="submit" disabled={isLoading}>
  {isLoading ? "Creating account…" : "Create account"}
</Button>

// Applied to delete:
<AlertDialogAction
  disabled={pending}
  onClick={handleDelete}
  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
  {pending ? "Deleting..." : "Delete world"}
</AlertDialogAction>
```

---

### `src/components/worlds/privacy-toggle.tsx` (component, Client)

**Analog:** `src/components/layout/sidebar.tsx` (button click → async action pattern)

**Async action handler pattern** (sidebar, lines 34–43):
```typescript
// Copy this async onClick + try/finally structure:
async function handleSignOut() {
  try {
    await signOut();
  } catch (err) {
    console.error("[sidebar] signOut error:", err);
  } finally {
    router.push("/login");
  }
}
```

**useOptimistic pattern** (no codebase analog — from RESEARCH.md):
```typescript
"use client";

import { useOptimistic, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { togglePrivacyAction } from "@/lib/actions/worlds";

export function PrivacyToggle({ worldId, isPublic }: { worldId: string; isPublic: boolean }) {
  const [optimisticIsPublic, setOptimisticIsPublic] = useOptimistic(isPublic);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOptimisticIsPublic(!optimisticIsPublic);
      await togglePrivacyAction(worldId);
    });
  }

  return (
    <Switch
      checked={optimisticIsPublic}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label="Toggle world privacy"
    />
  );
}
```

---

## Shared Patterns

### Auth Session Fetch (Server — apply to all RSC pages, layouts, and Server Actions)

**Source:** `src/app/(app)/layout.tsx` lines 1–13
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// In every Server Component page/layout and every Server Action:
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  redirect("/login");  // in pages/layouts
  // OR:
  throw new Error("Unauthorized");  // in Server Actions
}
```

**Apply to:** `dashboard/page.tsx`, `worlds/[slug]/layout.tsx`, `worlds/[slug]/page.tsx`, `lib/actions/worlds.ts` (all four actions)

---

### Async Params — Next.js 16 (apply to all dynamic route files)

**Source:** RESEARCH.md Pattern 2 (verified from `node_modules/next/dist/docs/`)
```typescript
// CRITICAL: params is a Promise in Next.js 16
// Apply to EVERY dynamic page and layout — sync access throws at runtime

export default async function WorldLayout({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;  // required await
}
```

**Apply to:** `src/app/(worlds)/worlds/[slug]/layout.tsx`, `src/app/(worlds)/worlds/[slug]/page.tsx`

---

### Cache Invalidation After Mutation (apply to all Server Actions)

**Source:** RESEARCH.md Pattern 5 (verified from Next.js 16 local docs)
```typescript
// CORRECT for Next.js 16 — NOT revalidateTag (requires cacheLife profile)
import { updateTag } from "next/cache";

// After list-level mutations (create, delete):
updateTag(`worlds-${session.user.id}`);

// After item-level mutations (edit, privacy toggle):
updateTag(`world-${worldId}`);
```

**Apply to:** all four actions in `src/lib/actions/worlds.ts`

---

### Tailwind Utility Classes (design system — apply to all new components)

**Source:** `src/app/(app)/dashboard/page.tsx` lines 8–21, `src/app/(auth)/login/page.tsx` lines 60–143

```
Page padding:          p-8
Page heading:          text-2xl font-semibold tracking-tight
Section heading:       text-lg font-semibold
Secondary text:        text-sm text-muted-foreground
Error text:            text-sm text-destructive
Slug / mono text:      font-mono text-sm text-muted-foreground
Form field stack:      space-y-1.5 (Label + Input)
Form spacing:          space-y-4
Card bg:               bg-card border border-border rounded-lg
Active nav item:       bg-muted text-foreground font-medium
Inactive nav item:     text-muted-foreground hover:bg-muted hover:text-foreground
Button pending:        disabled={pending} + label text change ("Creating...", "Saving...", "Deleting...")
```

---

### IDOR Protection (apply to all DB mutations in Server Actions)

**Source:** `src/lib/db/schema.ts` (ownerId column) + RESEARCH.md security section

```typescript
// ALWAYS scope mutations to both id AND ownerId — prevents cross-user tampering
import { eq, and } from "drizzle-orm";

await db
  .delete(worlds)
  .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));

await db
  .update(worlds)
  .set({ name, description })
  .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));
```

**Apply to:** `updateWorldAction`, `deleteWorldAction`, `togglePrivacyAction` in `src/lib/actions/worlds.ts`

---

### Zustand Store Pattern (for new UI stores if needed)

**Source:** `src/stores/use-ui-store.ts` lines 1–12
```typescript
import { create } from "zustand";

interface SomeStore {
  field: boolean;
  setField: (value: boolean) => void;
}

export const useSomeStore = create<SomeStore>((set) => ({
  field: false,
  setField: (value) => set({ field: value }),
}));
```

**Note:** Phase 2 dialog open/close state should use local `useState` in dialog components (simpler), not a Zustand store. Reserve Zustand for cross-component state.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/validations/worlds.ts` | utility | transform | No existing Zod schemas in codebase — first validation module |
| `src/lib/actions/worlds.ts` | service | CRUD | No existing Server Actions in codebase — auth page uses client-side Better Auth SDK calls, not `'use server'` functions |

Both files should use the RESEARCH.md code examples directly (Patterns 1–5), which are verified against the installed packages.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/lib/`, `src/stores/`, `src/proxy.ts`
**Files scanned:** 20
**Pattern extraction date:** 2026-06-19
