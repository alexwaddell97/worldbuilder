import { db } from "@/lib/db";
import { entityRelations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { EntityRelation } from "@/lib/db/schema";

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
