import { db } from "@/lib/db";
import { writingProjects, writingDocuments } from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import slugify from "slugify";
import type { WritingProject, WritingDocument } from "@/lib/db/schema";

export type { WritingProject, WritingDocument };

async function generateUniqueDocSlug(title: string, worldId: string, excludeId?: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true }) || "untitled";
  const existing = await db
    .select({ slug: writingDocuments.slug })
    .from(writingDocuments)
    .where(eq(writingDocuments.worldId, worldId));
  const taken = new Set(existing.filter((r) => r.slug !== excludeId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

async function generateUniqueProjectSlug(name: string, worldId: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true }) || "project";
  const existing = await db
    .select({ slug: writingProjects.slug })
    .from(writingProjects)
    .where(eq(writingProjects.worldId, worldId));
  const taken = new Set(existing.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function getWritingProjects(worldId: string): Promise<WritingProject[]> {
  return db
    .select()
    .from(writingProjects)
    .where(eq(writingProjects.worldId, worldId))
    .orderBy(asc(writingProjects.position), asc(writingProjects.createdAt));
}

export async function getWritingDocuments(worldId: string): Promise<WritingDocument[]> {
  return db
    .select()
    .from(writingDocuments)
    .where(eq(writingDocuments.worldId, worldId))
    .orderBy(asc(writingDocuments.position), asc(writingDocuments.createdAt));
}

export async function getWritingDocument(slug: string, worldId: string): Promise<WritingDocument | null> {
  const [doc] = await db
    .select()
    .from(writingDocuments)
    .where(and(eq(writingDocuments.slug, slug), eq(writingDocuments.worldId, worldId)))
    .limit(1);
  return doc ?? null;
}

export async function createWritingProject(worldId: string, name: string): Promise<WritingProject> {
  const slug = await generateUniqueProjectSlug(name, worldId);
  const [project] = await db
    .insert(writingProjects)
    .values({ worldId, name, slug })
    .returning();
  return project;
}

export async function createWritingDocument(
  worldId: string,
  projectId?: string | null
): Promise<WritingDocument> {
  const slug = await generateUniqueDocSlug("Untitled", worldId);
  const [doc] = await db
    .insert(writingDocuments)
    .values({ worldId, projectId: projectId ?? null, title: "Untitled", slug })
    .returning();
  return doc;
}

export async function updateWritingDocumentContent(
  id: string,
  worldId: string,
  content: unknown,
  wordCount: number
): Promise<void> {
  await db
    .update(writingDocuments)
    .set({ content: content as WritingDocument["content"], wordCount })
    .where(and(eq(writingDocuments.id, id), eq(writingDocuments.worldId, worldId)));
}

export async function setDocWordTarget(
  id: string,
  worldId: string,
  wordTarget: number | null
): Promise<void> {
  await db
    .update(writingDocuments)
    .set({ wordTarget })
    .where(and(eq(writingDocuments.id, id), eq(writingDocuments.worldId, worldId)));
}

export async function updateWritingDocumentTitle(
  id: string,
  worldId: string,
  title: string
): Promise<{ slug: string }> {
  const trimmed = title.trim() || "Untitled";
  const slug = await generateUniqueDocSlug(trimmed, worldId, id);
  await db
    .update(writingDocuments)
    .set({ title: trimmed, slug })
    .where(and(eq(writingDocuments.id, id), eq(writingDocuments.worldId, worldId)));
  return { slug };
}

export async function assignDocumentToProject(
  id: string,
  worldId: string,
  projectId: string | null
): Promise<void> {
  await db
    .update(writingDocuments)
    .set({ projectId })
    .where(and(eq(writingDocuments.id, id), eq(writingDocuments.worldId, worldId)));
}

export async function deleteWritingDocument(id: string, worldId: string): Promise<void> {
  await db
    .delete(writingDocuments)
    .where(and(eq(writingDocuments.id, id), eq(writingDocuments.worldId, worldId)));
}

export async function deleteWritingProject(id: string, worldId: string): Promise<void> {
  // Unassign docs in this project rather than deleting them
  await db
    .update(writingDocuments)
    .set({ projectId: null })
    .where(and(eq(writingDocuments.projectId, id), eq(writingDocuments.worldId, worldId)));
  await db
    .delete(writingProjects)
    .where(and(eq(writingProjects.id, id), eq(writingProjects.worldId, worldId)));
}
