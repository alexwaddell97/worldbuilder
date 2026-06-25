"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { upsertGraphSettings } from "@/lib/db/queries/graph-settings";

async function requireWorldOwner(worldId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
    .limit(1);
  if (!world) throw new Error("Not found");
}

export async function saveGraphSettingsAction(
  worldId: string,
  updates: {
    nodePositions?: Record<string, { x: number; y: number }>;
    hiddenEntityIds?: string[];
    hiddenTypeIds?: string[];
  }
): Promise<{ success: boolean }> {
  try {
    await requireWorldOwner(worldId);
    await upsertGraphSettings(worldId, updates);
    return { success: true };
  } catch {
    return { success: false };
  }
}
