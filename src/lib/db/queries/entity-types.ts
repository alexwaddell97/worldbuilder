import { db } from "@/lib/db";
import { entityTypes } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import type { EntityType } from "@/lib/db/schema";

/**
 * Returns all entity types for a world, ordered built-in first then by name.
 * Always world-scoped.
 */
export async function getEntityTypesByWorld(worldId: string): Promise<EntityType[]> {
  return db
    .select()
    .from(entityTypes)
    .where(eq(entityTypes.worldId, worldId))
    .orderBy(desc(entityTypes.isBuiltIn), asc(entityTypes.name));
}

/**
 * Returns a single entity type by slug within a world (IDOR-safe via worldId scoping).
 */
export async function getEntityTypeBySlug(
  worldId: string,
  slug: string
): Promise<EntityType | null> {
  const [et] = await db
    .select()
    .from(entityTypes)
    .where(and(eq(entityTypes.worldId, worldId), eq(entityTypes.slug, slug)))
    .limit(1);
  return et ?? null;
}
