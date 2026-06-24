"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds, entities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  type EntityActionState,
} from "@/lib/validations/entities";
import { generateUniqueEntitySlug, updateWikilinkLabels, markWikilinksDead } from "@/lib/db/queries/entities";

// ─── Ownership verification helper ────────────────────────────────────────────

async function verifyWorldOwnership(
  worldId: string,
  userId: string
): Promise<string | null> {
  const [world] = await db
    .select({ id: worlds.id })
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, userId)))
    .limit(1);
  return world?.id ?? null;
}

// ─── createEntityAction ───────────────────────────────────────────────────────

export async function createEntityAction(
  worldId: string,
  entityTypeId: string,
  prevState: EntityActionState,
  formData: FormData
): Promise<EntityActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return { message: "World not found." };

  const validated = CreateEntitySchema.safeParse({
    name: formData.get("name"),
    tags: formData.get("tags") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, tags: rawTags } = validated.data;

  // Normalize tags: split on comma, trim, lowercase, deduplicate, remove empty
  const tags = rawTags
    ? [
        ...new Set(
          rawTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        ),
      ]
    : [];

  const slug = await generateUniqueEntitySlug(name, verified);

  await db.insert(entities).values({
    worldId: verified,
    entityTypeId,
    name,
    slug,
    tags,
    customFields: {},
  });

  revalidatePath("/worlds");

  return { message: "saved" };
}

// ─── updateEntityAction ───────────────────────────────────────────────────────

export async function updateEntityAction(
  entityId: string,
  worldId: string,
  prevState: EntityActionState,
  formData: FormData
): Promise<EntityActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return { message: "World not found." };

  const validated = UpdateEntitySchema.safeParse({
    name: formData.get("name"),
    tags: formData.get("tags") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, tags: rawTags } = validated.data;

  const tags = rawTags
    ? [
        ...new Set(
          rawTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        ),
      ]
    : [];

  // Regenerate slug on rename — excludeId prevents self-collision
  const slug = await generateUniqueEntitySlug(name, verified, entityId);

  // Capture previous name for wikilink label fan-out on rename
  const [existing] = await db
    .select({ name: entities.name })
    .from(entities)
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)))
    .limit(1);

  // IDOR-safe: scope update to both entityId AND worldId
  await db
    .update(entities)
    .set({ name, slug, tags })
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)));

  // Fan out updated label to all wikilink nodes in the world
  if (existing && existing.name !== name) {
    await updateWikilinkLabels(verified, entityId, name);
  }

  revalidatePath("/worlds");

  return { message: "saved" };
}

// ─── deleteEntityAction ───────────────────────────────────────────────────────

export async function deleteEntityAction(
  entityId: string,
  worldId: string
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return;

  // Mark all wikilinks referencing this entity as dead BEFORE deleting
  await markWikilinksDead(verified, entityId);

  // IDOR-safe: scope delete to both entityId AND worldId
  await db
    .delete(entities)
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)));

  revalidatePath("/worlds");
}

// ─── saveEntityContentAction ──────────────────────────────────────────────────

export async function saveEntityContentAction(
  entityId: string,
  worldId: string,
  content: unknown
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db
    .update(entities)
    .set({ content: content as any })
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)));
}
