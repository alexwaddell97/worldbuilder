import { db } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { eq, and, like, ne, asc, ilike, arrayContains } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import slugify from "slugify";
import type { Entity } from "@/lib/db/schema";

interface GetEntitiesOptions {
  tag?: string;
  search?: string;
}

/**
 * Returns entities for a world + type, with optional tag filter and name search.
 * tag: exact array-contains match (uses GIN index).
 * search: case-insensitive substring match on name.
 * Always dual-scoped to worldId + entityTypeId.
 */
export async function getEntitiesByType(
  worldId: string,
  entityTypeId: string,
  opts: GetEntitiesOptions = {}
): Promise<Entity[]> {
  const conditions: SQL[] = [
    eq(entities.worldId, worldId),
    eq(entities.entityTypeId, entityTypeId),
  ];
  if (opts.tag) {
    conditions.push(arrayContains(entities.tags, [opts.tag]));
  }
  if (opts.search) {
    conditions.push(ilike(entities.name, `%${opts.search}%`));
  }
  return db
    .select()
    .from(entities)
    .where(and(...conditions))
    .orderBy(asc(entities.name));
}

/**
 * Returns a single entity by slug within a world (IDOR-safe).
 * Never queries by slug alone — always requires worldId.
 */
export async function getEntityBySlug(
  worldId: string,
  slug: string
): Promise<Entity | null> {
  const [entity] = await db
    .select()
    .from(entities)
    .where(and(eq(entities.worldId, worldId), eq(entities.slug, slug)))
    .limit(1);
  return entity ?? null;
}

/**
 * Generates a unique slug for an entity name within a world.
 * Pass excludeId when renaming to avoid self-collision.
 */
export async function generateUniqueEntitySlug(
  name: string,
  worldId: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });

  const conditions: SQL[] = [
    eq(entities.worldId, worldId),
    like(entities.slug, `${base}%`),
  ];
  if (excludeId) {
    conditions.push(ne(entities.id, excludeId));
  }

  const existing = await db
    .select({ slug: entities.slug })
    .from(entities)
    .where(and(...conditions));

  if (!existing.some((r) => r.slug === base)) return base;

  let i = 2;
  while (existing.some((r) => r.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}
