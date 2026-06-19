// no cacheTag — consumers use dynamic='force-dynamic' (RESEARCH Pitfall 5)

import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Returns all worlds owned by a given user, ordered by most recently updated.
 * Always owner-scoped — never returns other users' worlds.
 */
export async function getWorldsByOwner(ownerId: string) {
  return db
    .select()
    .from(worlds)
    .where(eq(worlds.ownerId, ownerId))
    .orderBy(desc(worlds.updatedAt));
}

/**
 * Returns a single world by slug scoped to a specific owner (IDOR-safe).
 * Never queries by slug alone — always requires ownerId to prevent cross-user access.
 */
export async function getWorldBySlug(slug: string, ownerId: string) {
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.slug, slug), eq(worlds.ownerId, ownerId)))
    .limit(1);
  return world ?? null;
}
