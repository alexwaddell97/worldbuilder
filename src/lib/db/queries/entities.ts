import { db } from "@/lib/db";
import { entities, entityTypes } from "@/lib/db/schema";
import { eq, and, like, ne, asc, ilike, arrayContains, isNotNull } from "drizzle-orm";
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

/**
 * Returns entities for wikilink autocomplete — name substring search, world-scoped.
 * Never queries across worlds.
 */
export type AutocompleteResult = {
  id: string;
  name: string;
  slug: string;
  entityTypeId: string;
  entityTypeName: string;
  entityTypeIcon: string | null;
};

export async function getEntitiesForAutocomplete(
  worldId: string,
  search: string,
  typeId?: string,
  limit = 40
): Promise<AutocompleteResult[]> {
  const conditions = [
    eq(entities.worldId, worldId),
    ilike(entities.name, `%${search}%`),
    ...(typeId ? [eq(entities.entityTypeId, typeId)] : []),
  ];
  return db
    .select({
      id: entities.id,
      name: entities.name,
      slug: entities.slug,
      entityTypeId: entityTypes.id,
      entityTypeName: entityTypes.name,
      entityTypeIcon: entityTypes.icon,
    })
    .from(entities)
    .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
    .where(and(...conditions))
    .orderBy(asc(entityTypes.name), asc(entities.name))
    .limit(limit);
}

function walkAndUpdate(node: unknown, entityId: string, newLabel: string): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  let changed = false;
  if (n.type === "wikilink" && n.attrs && typeof n.attrs === "object") {
    const attrs = n.attrs as Record<string, unknown>;
    if (attrs.id === entityId) {
      attrs.label = newLabel;
      changed = true;
    }
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      if (walkAndUpdate(child, entityId, newLabel)) changed = true;
    }
  }
  return changed;
}

/**
 * Fan-out label update: walks Tiptap JSON across all entities in a world,
 * updating wikilink nodes that reference entityId with newLabel.
 */
export async function updateWikilinkLabels(
  worldId: string,
  entityId: string,
  newLabel: string
): Promise<void> {
  const rows = await db
    .select({ id: entities.id, content: entities.content })
    .from(entities)
    .where(and(eq(entities.worldId, worldId), isNotNull(entities.content)));

  for (const row of rows) {
    const content = row.content as Record<string, unknown>;
    if (walkAndUpdate(content, entityId, newLabel)) {
      await db
        .update(entities)
        .set({ content })
        .where(and(eq(entities.id, row.id), eq(entities.worldId, worldId)));
    }
  }
}

function walkAndMarkDead(node: unknown, entityId: string): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  let changed = false;
  if (n.type === "wikilink" && n.attrs && typeof n.attrs === "object") {
    const attrs = n.attrs as Record<string, unknown>;
    if (attrs.id === entityId) {
      attrs.dead = true;
      changed = true;
    }
  }
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      if (walkAndMarkDead(child, entityId)) changed = true;
    }
  }
  return changed;
}

/**
 * Fan-out dead-link marking: walks Tiptap JSON across all entities in a world,
 * marking wikilink nodes referencing entityId as dead=true.
 * MUST be called before the entity is deleted.
 */
export async function markWikilinksDead(
  worldId: string,
  entityId: string
): Promise<void> {
  const rows = await db
    .select({ id: entities.id, content: entities.content })
    .from(entities)
    .where(and(eq(entities.worldId, worldId), isNotNull(entities.content)));

  for (const row of rows) {
    const content = row.content as Record<string, unknown>;
    if (walkAndMarkDead(content, entityId)) {
      await db
        .update(entities)
        .set({ content })
        .where(and(eq(entities.id, row.id), eq(entities.worldId, worldId)));
    }
  }
}
