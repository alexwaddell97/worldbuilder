"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds, entityTypes, entities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import slugify from "slugify";
import {
  CreateEntityTypeSchema,
  type EntityTypeActionState,
} from "@/lib/validations/entity-types";

// ─── Ownership verification helper ────────────────────────────────────────────

/**
 * Verifies the calling user owns the world.
 * Returns the worldId if valid, null otherwise.
 * Always call before any entity-type mutation.
 */
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

// ─── createEntityTypeAction ───────────────────────────────────────────────────

export async function createEntityTypeAction(
  worldId: string,
  prevState: EntityTypeActionState,
  formData: FormData
): Promise<EntityTypeActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return { message: "World not found." };

  const validated = CreateEntityTypeSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, icon } = validated.data;
  const slug = slugify(name, { lower: true, strict: true });

  // Check slug uniqueness within this world
  const [existing] = await db
    .select({ id: entityTypes.id })
    .from(entityTypes)
    .where(and(eq(entityTypes.worldId, verified), eq(entityTypes.slug, slug)))
    .limit(1);

  if (existing) {
    return { errors: { name: ["An entity type with this name already exists."] } };
  }

  await db.insert(entityTypes).values({
    worldId: verified,
    name,
    slug,
    icon: icon ?? null,
    isBuiltIn: false,
    customFieldsSchema: { fields: [] },
  });

  revalidatePath("/worlds");

  return { message: "saved" };
}

// ─── updateEntityTypeAction ───────────────────────────────────────────────────

export async function updateEntityTypeAction(
  entityTypeId: string,
  worldId: string,
  prevState: EntityTypeActionState,
  formData: FormData
): Promise<EntityTypeActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return { message: "World not found." };

  const validated = CreateEntityTypeSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, icon } = validated.data;

  // Slug is NOT regenerated on edit (URL stability).
  // IDOR-safe: scope update to entityTypeId + worldId; never mutate built-in types.
  await db
    .update(entityTypes)
    .set({ name, icon: icon ?? null })
    .where(
      and(
        eq(entityTypes.id, entityTypeId),
        eq(entityTypes.worldId, verified),
        eq(entityTypes.isBuiltIn, false)
      )
    );

  revalidatePath("/worlds");

  return { message: "saved" };
}

// ─── deleteEntityTypeAction ───────────────────────────────────────────────────

export async function deleteEntityTypeAction(
  entityTypeId: string,
  worldId: string
): Promise<{ error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const verified = await verifyWorldOwnership(worldId, session.user.id);
  if (!verified) return { error: "World not found." };

  // Check for existing entities — DB has onDelete: "restrict" on entityTypeId FK,
  // so the delete would throw. Return a user-friendly error instead.
  const [hasEntities] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.entityTypeId, entityTypeId))
    .limit(1);

  if (hasEntities) {
    return {
      error:
        "This entity type has entities. Delete all its entities before removing the type.",
    };
  }

  // IDOR-safe: scope delete to entityTypeId + worldId; never delete built-in types.
  await db
    .delete(entityTypes)
    .where(
      and(
        eq(entityTypes.id, entityTypeId),
        eq(entityTypes.worldId, verified),
        eq(entityTypes.isBuiltIn, false)
      )
    );

  revalidatePath("/worlds");

  return {};
}
