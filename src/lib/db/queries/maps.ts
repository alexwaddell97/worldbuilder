import { db } from "@/lib/db";
import { maps, mapPins, entities, entityTypes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { Map, MapPin, Entity, EntityType } from "@/lib/db/schema";
import slugify from "slugify";
import { like } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MapPinWithRefs = MapPin & {
  entity: (Entity & { entityType: EntityType }) | null;
  linkedMap: Map | null;
};

export type MapWithPins = Map & { pins: MapPinWithRefs[] };

export type MapTreeNode = Map & { children: MapTreeNode[] };

/** Builds a nested tree from a flat list of maps. */
export function buildMapTree(maps: Map[]): MapTreeNode[] {
  const byId = new Map(maps.map((m) => [m.id, { ...m, children: [] as MapTreeNode[] }]));
  const roots: MapTreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentMapId && byId.has(node.parentMapId)) {
      byId.get(node.parentMapId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export async function generateUniqueMapSlug(
  name: string,
  worldId: string
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true }) || "map";

  const existing = await db
    .select({ slug: maps.slug })
    .from(maps)
    .where(and(eq(maps.worldId, worldId), like(maps.slug, `${base}%`)));

  if (!existing.some((r) => r.slug === base)) return base;

  let i = 2;
  while (existing.some((r) => r.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getMapsByWorld(worldId: string): Promise<Map[]> {
  return db
    .select()
    .from(maps)
    .where(eq(maps.worldId, worldId))
    .orderBy(asc(maps.createdAt));
}

export async function getMapBySlug(
  slug: string,
  worldId: string
): Promise<Map | null> {
  const [map] = await db
    .select()
    .from(maps)
    .where(and(eq(maps.slug, slug), eq(maps.worldId, worldId)))
    .limit(1);
  return map ?? null;
}

export async function getMapById(id: string): Promise<Map | null> {
  const [map] = await db
    .select()
    .from(maps)
    .where(eq(maps.id, id))
    .limit(1);
  return map ?? null;
}

/**
 * Returns a map with all its pins, each pin including the linked entity+type
 * and the linked map (for drill-down navigation). IDOR-safe: requires worldId.
 */
export async function getMapWithPins(
  slug: string,
  worldId: string
): Promise<MapWithPins | null> {
  const map = await getMapBySlug(slug, worldId);
  if (!map) return null;

  // Fetch all pins for this map
  const pins = await db
    .select()
    .from(mapPins)
    .where(eq(mapPins.mapId, map.id))
    .orderBy(asc(mapPins.createdAt));

  // Enrich each pin with its entity (+ type) and linked map
  const enriched: MapPinWithRefs[] = await Promise.all(
    pins.map(async (pin) => {
      let entity: (Entity & { entityType: EntityType }) | null = null;
      let linkedMap: Map | null = null;

      if (pin.entityId) {
        const rows = await db
          .select({
            entity: entities,
            entityType: entityTypes,
          })
          .from(entities)
          .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
          .where(eq(entities.id, pin.entityId))
          .limit(1);

        if (rows[0]) {
          entity = { ...rows[0].entity, entityType: rows[0].entityType };
        }
      }

      if (pin.linkedMapId) {
        linkedMap = await getMapById(pin.linkedMapId);
      }

      return { ...pin, entity, linkedMap };
    })
  );

  return { ...map, pins: enriched };
}
