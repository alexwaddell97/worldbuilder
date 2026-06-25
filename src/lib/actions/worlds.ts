"use server";

// Note: per RESEARCH Pitfall 5, consuming pages export dynamic='force-dynamic',
// so updateTag(...) calls below are defensive hooks — they are harmless no-ops
// today but become load-bearing if 'use cache'/cacheTag is adopted in a later phase.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag, revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds, entityTypes } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";
import slugify from "slugify";
import {
  CreateWorldSchema,
  UpdateWorldSchema,
  WorldActionState,
} from "@/lib/validations/worlds";
import { WORLD_PRESETS } from "@/lib/constants/entity-types";
import type { PresetId } from "@/lib/constants/entity-types";

// ─── Slug Generation ──────────────────────────────────────────────────────────

/**
 * Generates a unique slug for a world name, scoped to a specific owner.
 * Appends -2, -3, ... suffixes until a slug is available for this owner.
 */
async function generateUniqueSlug(
  name: string,
  ownerId: string
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });

  // Check for existing slugs with this base prefix (for this owner only)
  const existing = await db
    .select({ slug: worlds.slug })
    .from(worlds)
    .where(and(eq(worlds.ownerId, ownerId), like(worlds.slug, `${base}%`)));

  if (!existing.some((r) => r.slug === base)) return base;

  // Find next available numeric suffix
  let i = 2;
  while (existing.some((r) => r.slug === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// ─── createWorldAction ────────────────────────────────────────────────────────

export async function createWorldAction(
  prevState: WorldActionState,
  formData: FormData
): Promise<WorldActionState> {
  // Always verify auth — ownerId comes ONLY from session, never from client
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const validated = CreateWorldSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    preset: formData.get("preset") ?? "blank",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, description, preset } = validated.data;
  const slug = await generateUniqueSlug(name, session.user.id);
  const presetTypes = WORLD_PRESETS[preset as PresetId]?.entityTypes ?? [];

  await db.transaction(async (tx) => {
    const [world] = await tx
      .insert(worlds)
      .values({
        name,
        description: description ?? null,
        slug,
        ownerId: session.user.id,
        isPublic: false,
      })
      .returning();

    if (presetTypes.length > 0) {
      await tx.insert(entityTypes).values(
        presetTypes.map((t) => ({
          worldId: world.id,
          name: t.name,
          namePlural: t.namePlural ?? null,
          slug: t.slug,
          icon: t.icon,
          isBuiltIn: true,
        }))
      );
    }
  });

  // updateTag for read-your-writes — defensive (consumers use force-dynamic; see file header)
  updateTag(`worlds-${session.user.id}`);
  revalidatePath("/dashboard");

  redirect(`/worlds/${slug}`);
}

// ─── updateWorldAction ────────────────────────────────────────────────────────

export async function updateWorldAction(
  worldId: string,
  prevState: WorldActionState,
  formData: FormData
): Promise<WorldActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateWorldSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl") || undefined,
    backgroundImageUrl: formData.get("backgroundImageUrl") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, description, imageUrl, backgroundImageUrl } = validated.data;

  // IDOR-safe: scope update to both worldId AND ownerId — non-owner's worldId matches zero rows
  await db
    .update(worlds)
    .set({ name, description: description ?? null, imageUrl: imageUrl || null, backgroundImageUrl: backgroundImageUrl || null })
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));

  // Slug is NOT regenerated on edit — URL stability after creation
  updateTag(`worlds-${session.user.id}`);
  updateTag(`world-${worldId}`);
  revalidatePath("/dashboard");

  // Return success — dialog closes client-side (no redirect)
  return { message: "saved" };
}

// ─── deleteWorldAction ────────────────────────────────────────────────────────

export async function deleteWorldAction(worldId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // IDOR-safe: scope delete to both worldId AND ownerId — non-owner's worldId matches zero rows
  await db
    .delete(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));

  updateTag(`worlds-${session.user.id}`);
  revalidatePath("/dashboard");

  redirect("/dashboard");
}

// ─── togglePrivacyAction ──────────────────────────────────────────────────────

export async function togglePrivacyAction(worldId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Fetch current isPublic — scoped to owner (IDOR-safe)
  const [current] = await db
    .select({ isPublic: worlds.isPublic })
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
    .limit(1);

  if (!current) return; // world not found or not owned — silently no-op

  // IDOR-safe: scope update to both worldId AND ownerId
  await db
    .update(worlds)
    .set({ isPublic: !current.isPublic })
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)));

  updateTag(`world-${worldId}`);
  updateTag(`worlds-${session.user.id}`);
  revalidatePath("/dashboard");
}
