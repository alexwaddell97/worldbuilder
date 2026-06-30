import { db } from "@/lib/db";
import { entityRelations, entities, entityTypes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { EntityRelation } from "@/lib/db/schema";

export type EntityRelationWithContext = {
  id: string;
  label: string;
  direction: "source" | "target";
  otherEntityId: string;
  otherEntityName: string;
  otherEntitySlug: string;
  otherEntityTypeSlug: string;
  otherEntityTypeName: string;
  otherEntityTypeIcon: string | null;
};

export async function getEntityRelationsByEntity(
  entityId: string,
  worldId: string
): Promise<EntityRelationWithContext[]> {
  const shared = {
    id: entityRelations.id,
    label: entityRelations.label,
    otherEntityId: entities.id,
    otherEntityName: entities.name,
    otherEntitySlug: entities.slug,
    otherEntityTypeSlug: entityTypes.slug,
    otherEntityTypeName: entityTypes.name,
    otherEntityTypeIcon: entityTypes.icon,
  };

  const [asSource, asTarget] = await Promise.all([
    db
      .select(shared)
      .from(entityRelations)
      .innerJoin(entities, eq(entities.id, entityRelations.targetEntityId))
      .innerJoin(entityTypes, eq(entityTypes.id, entities.entityTypeId))
      .where(and(eq(entityRelations.sourceEntityId, entityId), eq(entityRelations.worldId, worldId))),

    db
      .select(shared)
      .from(entityRelations)
      .innerJoin(entities, eq(entities.id, entityRelations.sourceEntityId))
      .innerJoin(entityTypes, eq(entityTypes.id, entities.entityTypeId))
      .where(and(eq(entityRelations.targetEntityId, entityId), eq(entityRelations.worldId, worldId))),
  ]);

  return [
    ...asSource.map((r) => ({ ...r, direction: "source" as const })),
    ...asTarget.map((r) => ({ ...r, direction: "target" as const })),
  ];
}

export async function getPublicEntityRelationsByEntity(
  entityId: string,
  worldId: string
): Promise<EntityRelationWithContext[]> {
  const shared = {
    id: entityRelations.id,
    label: entityRelations.label,
    otherEntityId: entities.id,
    otherEntityName: entities.name,
    otherEntitySlug: entities.slug,
    otherEntityTypeSlug: entityTypes.slug,
    otherEntityTypeName: entityTypes.name,
    otherEntityTypeIcon: entityTypes.icon,
  };

  const visible = and(
    eq(entities.isHiddenFromPublic, false),
    eq(entityTypes.isHiddenFromPublic, false)
  );

  const [asSource, asTarget] = await Promise.all([
    db
      .select(shared)
      .from(entityRelations)
      .innerJoin(entities, eq(entities.id, entityRelations.targetEntityId))
      .innerJoin(entityTypes, eq(entityTypes.id, entities.entityTypeId))
      .where(and(eq(entityRelations.sourceEntityId, entityId), eq(entityRelations.worldId, worldId), visible)),

    db
      .select(shared)
      .from(entityRelations)
      .innerJoin(entities, eq(entities.id, entityRelations.sourceEntityId))
      .innerJoin(entityTypes, eq(entityTypes.id, entities.entityTypeId))
      .where(and(eq(entityRelations.targetEntityId, entityId), eq(entityRelations.worldId, worldId), visible)),
  ]);

  return [
    ...asSource.map((r) => ({ ...r, direction: "source" as const })),
    ...asTarget.map((r) => ({ ...r, direction: "target" as const })),
  ];
}

export async function getEntityRelationsByWorld(worldId: string): Promise<EntityRelation[]> {
  return db
    .select()
    .from(entityRelations)
    .where(eq(entityRelations.worldId, worldId));
}

export async function createEntityRelation(data: {
  worldId: string;
  sourceEntityId: string;
  targetEntityId: string;
  label: string;
}): Promise<EntityRelation> {
  const [rel] = await db.insert(entityRelations).values(data).returning();
  return rel;
}

export async function updateEntityRelationLabel(
  id: string,
  worldId: string,
  label: string
): Promise<void> {
  await db
    .update(entityRelations)
    .set({ label })
    .where(and(eq(entityRelations.id, id), eq(entityRelations.worldId, worldId)));
}

export async function deleteEntityRelation(id: string, worldId: string): Promise<void> {
  await db
    .delete(entityRelations)
    .where(and(eq(entityRelations.id, id), eq(entityRelations.worldId, worldId)));
}
