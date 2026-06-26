"use server";

import { getPublicWorldById, getPublicEntityWithTypeById } from "@/lib/db/queries/public";
import type { Entity, EntityType } from "@/lib/db/schema";

export async function getPublicEntityWithTypeByIdAction(
  worldId: string,
  entityId: string
): Promise<{ entity: Entity; entityType: EntityType } | null> {
  const world = await getPublicWorldById(worldId);
  if (!world) return null;
  return getPublicEntityWithTypeById(worldId, entityId);
}
