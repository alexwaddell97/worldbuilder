import { db } from "@/lib/db";
import { entities, entityTypes, entityRelations, maps, writingDocuments } from "@/lib/db/schema";
import { eq, and, or, ilike, asc, sql } from "drizzle-orm";
import { blobDisplayUrl } from "@/lib/utils";

export type SnippetField = "tags" | "content" | "description" | "relationship";

export type UnifiedSearchResult = {
  kind: "entity" | "map" | "writing";
  id: string;
  name: string;
  slug: string;
  entityTypeSlug?: string;
  entityTypeName?: string;
  entityTypeIcon?: string | null;
  imageUrl?: string | null;
  snippet?: string;
  snippetField?: SnippetField;
};

// ─── Text helpers ─────────────────────────────────────────────────────────────

function extractTiptapText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (n.type === "text" && typeof n.text === "string") return n.text;
  // Wikilink atom nodes store their display text in attrs.label
  if (n.type === "wikilink") {
    const attrs = n.attrs as Record<string, unknown> | undefined;
    if (attrs && typeof attrs.label === "string") return attrs.label;
  }
  if (Array.isArray(n.content)) {
    return n.content.map(extractTiptapText).filter(Boolean).join(" ");
  }
  return "";
}

function getExcerpt(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return "";
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = "…" + excerpt;
  if (end < text.length) excerpt += "…";
  return excerpt;
}

function buildSnippet(
  q: string,
  name: string,
  opts: { tags?: string[]; content?: unknown; description?: string | null; relationLabel?: string | null; alwaysContent?: boolean }
): { snippet?: string; snippetField?: SnippetField } {
  const lower = q.toLowerCase();

  // Name matched — the name row already communicates the hit, no snippet needed
  // (unless alwaysContent is set, e.g. for prose writing where context matters)
  if (!opts.alwaysContent && name.toLowerCase().includes(lower)) return {};

  // Tags — show the first matching tag
  if (opts.tags?.length) {
    const tag = opts.tags.find((t) => t.toLowerCase().includes(lower));
    if (tag) return { snippet: tag, snippetField: "tags" };
  }

  // Relationship label
  if (opts.relationLabel) {
    return { snippet: opts.relationLabel, snippetField: "relationship" };
  }

  // Description
  if (opts.description) {
    const excerpt = getExcerpt(opts.description, q);
    if (excerpt) return { snippet: excerpt, snippetField: "description" };
  }

  // Tiptap content
  if (opts.content) {
    const text = extractTiptapText(opts.content);
    const excerpt = getExcerpt(text, q);
    if (excerpt) return { snippet: excerpt, snippetField: "content" };
  }

  return {};
}

// ─── Match conditions ──────────────────────────────────────────────────────────

const pat = (q: string) => `%${q}%`;

function entityMatch(q: string) {
  return or(
    ilike(entities.name, pat(q)),
    sql`array_to_string(${entities.tags}, ' ') ILIKE ${pat(q)}`,
    sql`${entities.content}::text ILIKE ${pat(q)}`,
    sql`EXISTS (
      SELECT 1 FROM entity_relations er
      WHERE (er.source_entity_id = ${entities.id} OR er.target_entity_id = ${entities.id})
      AND LOWER(er.label) LIKE LOWER(${pat(q)})
    )`
  );
}

// Subquery: returns a formatted relationship string e.g. "Aragorn serves Gondor"
// Direction is preserved — source entity appears on the left, target on the right.
const relationSnippetSubquery = (q: string) =>
  sql<string | null>`(
    SELECT
      CASE
        WHEN er.source_entity_id = ${entities.id}
        THEN ${entities.name} || ' → ' || er.label || ' → ' || other_e.name
        ELSE other_e.name || ' → ' || er.label || ' → ' || ${entities.name}
      END
    FROM entity_relations er
    JOIN entities other_e ON other_e.id = CASE
      WHEN er.source_entity_id = ${entities.id} THEN er.target_entity_id
      ELSE er.source_entity_id
    END
    WHERE (er.source_entity_id = ${entities.id} OR er.target_entity_id = ${entities.id})
    AND LOWER(er.label) LIKE LOWER(${pat(q)})
    LIMIT 1
  )`;

function mapMatch(q: string) {
  return or(ilike(maps.name, pat(q)), sql`${maps.description} ILIKE ${pat(q)}`);
}

function writingMatch(q: string) {
  return or(
    ilike(writingDocuments.title, pat(q)),
    sql`${writingDocuments.content}::text ILIKE ${pat(q)}`
  );
}

const nameFirst = (col: typeof entities.name | typeof maps.name | typeof writingDocuments.title, q: string) =>
  sql`CASE WHEN LOWER(${col}) LIKE LOWER(${q + "%"}) THEN 0 ELSE 1 END`;

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function searchWorld(
  worldId: string,
  query: string
): Promise<UnifiedSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [entityRows, mapRows, writingRows] = await Promise.all([
    db
      .select({
        id: entities.id,
        name: entities.name,
        slug: entities.slug,
        entityTypeSlug: entityTypes.slug,
        entityTypeName: entityTypes.name,
        entityTypeIcon: entityTypes.icon,
        imageUrl: entities.imageUrl,
        tags: entities.tags,
        content: entities.content,
        relationLabel: relationSnippetSubquery(q),
      })
      .from(entities)
      .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
      .where(and(eq(entities.worldId, worldId), entityMatch(q)))
      .orderBy(nameFirst(entities.name, q), asc(entities.name))
      .limit(20),

    db
      .select({ id: maps.id, name: maps.name, slug: maps.slug, description: maps.description })
      .from(maps)
      .where(and(eq(maps.worldId, worldId), mapMatch(q)))
      .orderBy(nameFirst(maps.name, q), asc(maps.name))
      .limit(8),

    db
      .select({ id: writingDocuments.id, name: writingDocuments.title, slug: writingDocuments.slug, content: writingDocuments.content })
      .from(writingDocuments)
      .where(and(eq(writingDocuments.worldId, worldId), writingMatch(q)))
      .orderBy(nameFirst(writingDocuments.title, q), asc(writingDocuments.title))
      .limit(8),
  ]);

  return [
    ...entityRows.map(({ tags, content, relationLabel, imageUrl, ...r }) => ({
      ...r,
      kind: "entity" as const,
      imageUrl: imageUrl ? blobDisplayUrl(imageUrl) : null,
      ...buildSnippet(q, r.name, { tags, content, relationLabel }),
    })),
    ...mapRows.map(({ description, ...r }) => ({
      ...r,
      kind: "map" as const,
      ...buildSnippet(q, r.name, { description }),
    })),
    ...writingRows.map(({ content, ...r }) => ({
      ...r,
      kind: "writing" as const,
      ...buildSnippet(q, r.name, { content, alwaysContent: true }),
    })),
  ];
}

export async function searchPublicWorld(
  worldId: string,
  query: string
): Promise<UnifiedSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [entityRows, mapRows, writingRows] = await Promise.all([
    db
      .select({
        id: entities.id,
        name: entities.name,
        slug: entities.slug,
        entityTypeSlug: entityTypes.slug,
        entityTypeName: entityTypes.name,
        entityTypeIcon: entityTypes.icon,
        imageUrl: entities.imageUrl,
        tags: entities.tags,
        content: entities.content,
        relationLabel: relationSnippetSubquery(q),
      })
      .from(entities)
      .innerJoin(entityTypes, eq(entities.entityTypeId, entityTypes.id))
      .where(
        and(
          eq(entities.worldId, worldId),
          entityMatch(q),
          eq(entities.isHiddenFromPublic, false),
          eq(entityTypes.isHiddenFromPublic, false)
        )
      )
      .orderBy(nameFirst(entities.name, q), asc(entities.name))
      .limit(20),

    db
      .select({ id: maps.id, name: maps.name, slug: maps.slug, description: maps.description })
      .from(maps)
      .where(
        and(eq(maps.worldId, worldId), mapMatch(q), eq(maps.isHiddenFromPublic, false))
      )
      .orderBy(nameFirst(maps.name, q), asc(maps.name))
      .limit(8),

    db
      .select({ id: writingDocuments.id, name: writingDocuments.title, slug: writingDocuments.slug, content: writingDocuments.content })
      .from(writingDocuments)
      .where(
        and(
          eq(writingDocuments.worldId, worldId),
          writingMatch(q),
          eq(writingDocuments.isPublished, true)
        )
      )
      .orderBy(nameFirst(writingDocuments.title, q), asc(writingDocuments.title))
      .limit(8),
  ]);

  return [
    ...entityRows.map(({ tags, content, relationLabel, imageUrl, ...r }) => ({
      ...r,
      kind: "entity" as const,
      imageUrl: imageUrl ? blobDisplayUrl(imageUrl) : null,
      ...buildSnippet(q, r.name, { tags, content, relationLabel }),
    })),
    ...mapRows.map(({ description, ...r }) => ({
      ...r,
      kind: "map" as const,
      ...buildSnippet(q, r.name, { description }),
    })),
    ...writingRows.map(({ content, ...r }) => ({
      ...r,
      kind: "writing" as const,
      ...buildSnippet(q, r.name, { content, alwaysContent: true }),
    })),
  ];
}
