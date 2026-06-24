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
import { generateUniqueEntitySlug } from "@/lib/db/queries/entities";

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

  // IDOR-safe: scope update to both entityId AND worldId
  await db
    .update(entities)
    .set({ name, slug, tags })
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)));

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

  // IDOR-safe: scope delete to both entityId AND worldId
  await db
    .delete(entities)
    .where(and(eq(entities.id, entityId), eq(entities.worldId, verified)));

  revalidatePath("/worlds");
}
