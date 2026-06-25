import { db } from "@/lib/db";
import { worldGraphSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { WorldGraphSettings } from "@/lib/db/schema";

export async function getGraphSettings(worldId: string): Promise<WorldGraphSettings | null> {
  const [row] = await db
    .select()
    .from(worldGraphSettings)
    .where(eq(worldGraphSettings.worldId, worldId))
    .limit(1);
  return row ?? null;
}

export async function upsertGraphSettings(
  worldId: string,
  updates: Partial<{
    nodePositions: Record<string, { x: number; y: number }>;
    hiddenEntityIds: string[];
    hiddenTypeIds: string[];
  }>
): Promise<void> {
  await db
    .insert(worldGraphSettings)
    .values({ worldId, ...updates })
    .onConflictDoUpdate({
      target: worldGraphSettings.worldId,
      set: { ...updates, updatedAt: new Date() },
    });
}
