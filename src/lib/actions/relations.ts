"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createEntityRelation,
  updateEntityRelationLabel,
  deleteEntityRelation,
} from "@/lib/db/queries/relations";

async function requireWorldOwner(worldId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
    .limit(1);
  if (!world) throw new Error("Not found");
  return session;
}

export async function createRelationAction(
  worldId: string,
  sourceEntityId: string,
  targetEntityId: string,
  label: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireWorldOwner(worldId);
    if (!label.trim()) return { success: false, error: "Label is required." };
    const rel = await createEntityRelation({ worldId, sourceEntityId, targetEntityId, label: label.trim() });
    return { success: true, id: rel.id };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function updateRelationAction(
  id: string,
  worldId: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireWorldOwner(worldId);
    if (!label.trim()) return { success: false, error: "Label is required." };
    await updateEntityRelationLabel(id, worldId, label.trim());
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

export async function deleteRelationAction(
  id: string,
  worldId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireWorldOwner(worldId);
    await deleteEntityRelation(id, worldId);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
