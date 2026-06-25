"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { worlds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createWritingDocument,
  createWritingProject,
  updateWritingDocumentContent,
  updateWritingDocumentTitle,
  assignDocumentToProject,
  deleteWritingDocument,
  deleteWritingProject,
  setDocWordTarget,
} from "@/lib/db/queries/writing";

async function requireWorldOwner(worldId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");
  const [world] = await db
    .select()
    .from(worlds)
    .where(and(eq(worlds.id, worldId), eq(worlds.ownerId, session.user.id)))
    .limit(1);
  if (!world) throw new Error("Not found");
  return world;
}

function revalidateWriting(worldSlug: string) {
  revalidatePath(`/worlds/${worldSlug}/writing`, "layout");
}

export async function createWritingDocumentAction(
  worldId: string,
  worldSlug: string,
  projectId?: string | null
): Promise<void> {
  await requireWorldOwner(worldId);
  const doc = await createWritingDocument(worldId, projectId);
  revalidateWriting(worldSlug);
  redirect(`/worlds/${worldSlug}/writing/${doc.slug}`);
}

export async function createWritingProjectAction(
  worldId: string,
  worldSlug: string,
  name: string
): Promise<{ success: boolean; id?: string }> {
  try {
    await requireWorldOwner(worldId);
    const project = await createWritingProject(worldId, name);
    revalidateWriting(worldSlug);
    return { success: true, id: project.id };
  } catch {
    return { success: false };
  }
}

export async function saveWritingDocumentContentAction(
  docId: string,
  worldId: string,
  content: unknown,
  wordCount: number
): Promise<{ success: boolean }> {
  try {
    await requireWorldOwner(worldId);
    await updateWritingDocumentContent(docId, worldId, content, wordCount);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function setWordTargetAction(
  docId: string,
  worldId: string,
  worldSlug: string,
  wordTarget: number | null
): Promise<{ success: boolean }> {
  try {
    await requireWorldOwner(worldId);
    await setDocWordTarget(docId, worldId, wordTarget);
    revalidateWriting(worldSlug);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateWritingDocumentTitleAction(
  docId: string,
  worldId: string,
  worldSlug: string,
  title: string
): Promise<{ success: boolean; slug?: string }> {
  try {
    await requireWorldOwner(worldId);
    const { slug } = await updateWritingDocumentTitle(docId, worldId, title);
    revalidateWriting(worldSlug);
    return { success: true, slug };
  } catch {
    return { success: false };
  }
}

export async function assignDocumentToProjectAction(
  docId: string,
  worldId: string,
  worldSlug: string,
  projectId: string | null
): Promise<{ success: boolean }> {
  try {
    await requireWorldOwner(worldId);
    await assignDocumentToProject(docId, worldId, projectId);
    revalidateWriting(worldSlug);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteWritingDocumentAction(
  docId: string,
  worldId: string,
  worldSlug: string,
  currentDocSlug: string,
  deletedDocSlug: string
): Promise<void> {
  await requireWorldOwner(worldId);
  await deleteWritingDocument(docId, worldId);
  revalidateWriting(worldSlug);
  if (currentDocSlug === deletedDocSlug) {
    redirect(`/worlds/${worldSlug}/writing`);
  }
}

export async function deleteWritingProjectAction(
  projectId: string,
  worldId: string,
  worldSlug: string
): Promise<{ success: boolean }> {
  try {
    await requireWorldOwner(worldId);
    await deleteWritingProject(projectId, worldId);
    revalidateWriting(worldSlug);
    return { success: true };
  } catch {
    return { success: false };
  }
}
