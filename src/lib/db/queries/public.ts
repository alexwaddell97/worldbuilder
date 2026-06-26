// Public-world queries — all functions require the world to have isPublic=true.
// Never call these without first verifying the world is public.

import { db } from "@/lib/db";
import { worlds, entityTypes, entities, maps, mapPins, entityRelations, writingDocuments, writingProjects } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { Map, MapPin, Entity, EntityType, WritingDocument, WritingProject } from "@/lib/db/schema";
import type { MapPinWithRefs, MapWithPins } from "./maps";

// ─── World ────────────────────────────────────────────────────────────────────

export async function getPublicWorldBySlug(publicSlug: string) {
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.publicSlug, publicSlug), eq(worlds.isPublic, true)))
    .limit(1);
  return world ?? null;
}

export async function getPublicWorldById(worldId: string) {
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.isPublic, true)))
    .limit(1);
  return world ?? null;
}

// ─── Entity Types ─────────────────────────────────────────────────────────────

export async function getPublicEntityTypes(worldId: string) {
  return db
    .select()
    .from(entityTypes)
    .where(and(eq(entityTypes.worldId, worldId), eq(entityTypes.isHiddenFromPublic, false)))
    .orderBy(asc(entityTypes.name));
}

export async function getPublicEntityTypeBySlug(worldId: string, typeSlug: string) {
  const [et] = await db
    .select()
    .from(entityTypes)
    .where(and(eq(entityTypes.worldId, worldId), eq(entityTypes.slug, typeSlug), eq(entityTypes.isHiddenFromPublic, false)))
    .limit(1);
  return et ?? null;
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export async function getPublicEntitiesByType(worldId: string, entityTypeId: string): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(and(eq(entities.worldId, worldId), eq(entities.entityTypeId, entityTypeId), eq(entities.isHiddenFromPublic, false)))
    .orderBy(asc(entities.name));
}

export async function getPublicEntityBySlug(
  worldId: string,
  entitySlug: string
): Promise<(Entity & { entityType: EntityType }) | null> {
  const [row] = await db
    .select({ entity: entities, entityType: entityTypes })
    .from(entities)
    .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
    .where(and(
      eq(entities.worldId, worldId),
      eq(entities.slug, entitySlug),
      eq(entities.isHiddenFromPublic, false),
      eq(entityTypes.isHiddenFromPublic, false),
    ))
    .limit(1);
  if (!row) return null;
  return { ...row.entity, entityType: row.entityType };
}

export async function getPublicAllEntitiesWithTypes(
  worldId: string
): Promise<(Entity & { entityType: EntityType })[]> {
  const rows = await db
    .select({ entity: entities, entityType: entityTypes })
    .from(entities)
    .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
    .where(and(
      eq(entities.worldId, worldId),
      eq(entities.isHiddenFromPublic, false),
      eq(entityTypes.isHiddenFromPublic, false),
    ))
    .orderBy(asc(entityTypes.name), asc(entities.name));
  return rows.map((r) => ({ ...r.entity, entityType: r.entityType }));
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

export async function getPublicRootMaps(worldId: string): Promise<Map[]> {
  return db
    .select()
    .from(maps)
    .where(and(eq(maps.worldId, worldId), eq(maps.isRootMap, true)))
    .orderBy(asc(maps.createdAt));
}

export async function getPublicMapBySlug(worldId: string, mapSlug: string): Promise<Map | null> {
  const [map] = await db
    .select()
    .from(maps)
    .where(and(eq(maps.slug, mapSlug), eq(maps.worldId, worldId)))
    .limit(1);
  return map ?? null;
}

async function getPublicMapById(id: string): Promise<Map | null> {
  const [map] = await db.select().from(maps).where(eq(maps.id, id)).limit(1);
  return map ?? null;
}

export async function getPublicMapWithPins(
  worldId: string,
  mapSlug: string
): Promise<MapWithPins | null> {
  const map = await getPublicMapBySlug(worldId, mapSlug);
  if (!map) return null;

  const pins = await db
    .select()
    .from(mapPins)
    .where(eq(mapPins.mapId, map.id))
    .orderBy(asc(mapPins.createdAt));

  const enriched: MapPinWithRefs[] = await Promise.all(
    pins.map(async (pin) => {
      let entity: (Entity & { entityType: EntityType }) | null = null;
      let linkedMap: Map | null = null;

      if (pin.entityId) {
        const rows = await db
          .select({ entity: entities, entityType: entityTypes })
          .from(entities)
          .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
          .where(eq(entities.id, pin.entityId))
          .limit(1);
        if (rows[0]) entity = { ...rows[0].entity, entityType: rows[0].entityType };
      }

      if (pin.linkedMapId) {
        linkedMap = await getPublicMapById(pin.linkedMapId);
      }

      return { ...pin, entity, linkedMap };
    })
  );

  return { ...map, pins: enriched };
}

// ─── Relations ────────────────────────────────────────────────────────────────

export async function getPublicEntityRelations(worldId: string) {
  return db
    .select()
    .from(entityRelations)
    .where(eq(entityRelations.worldId, worldId));
}

// ─── Entity by ID (for wikilink drawer) ──────────────────────────────────────

export async function getPublicEntityWithTypeById(
  worldId: string,
  entityId: string
): Promise<{ entity: Entity; entityType: EntityType } | null> {
  const [row] = await db
    .select({ entity: entities, entityType: entityTypes })
    .from(entities)
    .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
    .where(and(eq(entities.worldId, worldId), eq(entities.id, entityId)))
    .limit(1);
  return row ?? null;
}

// ─── Writing / Stories ────────────────────────────────────────────────────────

export type PublishedStory = WritingDocument & { project: WritingProject | null };

export async function getPublishedStories(worldId: string): Promise<PublishedStory[]> {
  const rows = await db
    .select({ doc: writingDocuments, project: writingProjects })
    .from(writingDocuments)
    .leftJoin(writingProjects, eq(writingDocuments.projectId, writingProjects.id))
    .where(and(eq(writingDocuments.worldId, worldId), eq(writingDocuments.isPublished, true)))
    .orderBy(asc(writingProjects.position), asc(writingDocuments.position), asc(writingDocuments.createdAt));
  return rows.map((r) => ({ ...r.doc, project: r.project ?? null }));
}

export async function getPublishedStoryBySlug(
  worldId: string,
  docSlug: string
): Promise<WritingDocument | null> {
  const [doc] = await db
    .select()
    .from(writingDocuments)
    .where(
      and(
        eq(writingDocuments.worldId, worldId),
        eq(writingDocuments.slug, docSlug),
        eq(writingDocuments.isPublished, true)
      )
    )
    .limit(1);
  return doc ?? null;
}
