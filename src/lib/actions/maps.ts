"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { maps, mapPins, worlds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  CreateMapSchema,
  UpdateMapSchema,
  CreateMapPinSchema,
  UpdateMapPinSchema,
} from "@/lib/validations/maps";
import {
  generateUniqueMapSlug,
  getMapBySlug,
  getMapById,
} from "@/lib/db/queries/maps";
import { getWorldBySlug } from "@/lib/db/queries/worlds";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireWorldOwner(worldId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
    .limit(1);

  if (!world) throw new Error("Not found");
  return { session, world };
}

async function requireMapOwner(mapId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const map = await getMapById(mapId);
  if (!map) throw new Error("Map not found");

  await requireWorldOwner(map.worldId);
  return { session, map };
}

// ─── Map CRUD ─────────────────────────────────────────────────────────────────

export async function createMapAction(
  worldId: string,
  data: unknown
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    await requireWorldOwner(worldId);

    const parsed = CreateMapSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input." };
    }

    const { name, description, imageUrl, parentMapId } = parsed.data;
    const slug = await generateUniqueMapSlug(name, worldId);

    await db.insert(maps).values({
      worldId,
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      parentMapId: parentMapId ?? null,
    });

    revalidatePath(`/worlds/[slug]/maps`, "page");
    return { success: true, slug };
  } catch (err) {
    console.error("[createMapAction]", err);
    return { success: false, error: "Failed to create map." };
  }
}

export async function updateMapAction(
  mapId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const { map } = await requireMapOwner(mapId);

    const parsed = UpdateMapSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input." };
    }

    const { name, description, imageUrl, parentMapId } = parsed.data;

    await db
      .update(maps)
      .set({
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        parentMapId: parentMapId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maps.id, mapId));

    revalidatePath(`/worlds/[slug]/maps`, "page");
    return { success: true };
  } catch (err) {
    console.error("[updateMapAction]", err);
    return { success: false, error: "Failed to update map." };
  }
}

export async function deleteMapAction(
  mapId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireMapOwner(mapId);

    await db.delete(maps).where(eq(maps.id, mapId));

    revalidatePath(`/worlds/[slug]/maps`, "page");
    return { success: true };
  } catch (err) {
    console.error("[deleteMapAction]", err);
    return { success: false, error: "Failed to delete map." };
  }
}

export async function toggleMapPublicVisibilityAction(
  mapId: string
): Promise<{ isHiddenFromPublic: boolean }> {
  const { map } = await requireMapOwner(mapId);
  const next = !map.isHiddenFromPublic;
  await db.update(maps).set({ isHiddenFromPublic: next }).where(eq(maps.id, mapId));
  revalidatePath(`/worlds/[slug]/maps`, "page");
  return { isHiddenFromPublic: next };
}

// ─── Pin CRUD ─────────────────────────────────────────────────────────────────

export async function createMapPinAction(
  data: unknown
): Promise<{ success: boolean; pinId?: string; error?: string }> {
  try {
    const parsed = CreateMapPinSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid pin data." };
    }

    await requireMapOwner(parsed.data.mapId);

    const [pin] = await db
      .insert(mapPins)
      .values({
        mapId: parsed.data.mapId,
        entityId: parsed.data.entityId ?? null,
        linkedMapId: parsed.data.linkedMapId ?? null,
        label: parsed.data.label ?? null,
        x: parsed.data.x,
        y: parsed.data.y,
        icon: parsed.data.icon ?? null,
        color: parsed.data.color ?? null,
      })
      .returning({ id: mapPins.id });

    return { success: true, pinId: pin.id };
  } catch (err) {
    console.error("[createMapPinAction]", err);
    return { success: false, error: "Failed to create pin." };
  }
}

export async function updateMapPinAction(
  pinId: string,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const [pin] = await db
      .select()
      .from(mapPins)
      .where(eq(mapPins.id, pinId))
      .limit(1);

    if (!pin) return { success: false, error: "Pin not found." };

    await requireMapOwner(pin.mapId);

    const parsed = UpdateMapPinSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid pin data." };
    }

    await db
      .update(mapPins)
      .set({
        entityId: parsed.data.entityId ?? null,
        linkedMapId: parsed.data.linkedMapId ?? null,
        label: parsed.data.label ?? null,
        icon: parsed.data.icon ?? null,
        color: parsed.data.color ?? null,
      })
      .where(eq(mapPins.id, pinId));

    return { success: true };
  } catch (err) {
    console.error("[updateMapPinAction]", err);
    return { success: false, error: "Failed to update pin." };
  }
}

export async function deleteMapPinAction(
  pinId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [pin] = await db
      .select()
      .from(mapPins)
      .where(eq(mapPins.id, pinId))
      .limit(1);

    if (!pin) return { success: false, error: "Pin not found." };

    await requireMapOwner(pin.mapId);

    await db.delete(mapPins).where(eq(mapPins.id, pinId));

    return { success: true };
  } catch (err) {
    console.error("[deleteMapPinAction]", err);
    return { success: false, error: "Failed to delete pin." };
  }
}
