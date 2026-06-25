import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import JSZip from "jszip";
import { get as getBlobContent } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";
import { getMapsByWorld } from "@/lib/db/queries/maps";
import { getWritingProjects, getWritingDocuments } from "@/lib/db/queries/writing";
import { getEntityRelationsByWorld } from "@/lib/db/queries/relations";
import { tiptapToMarkdown } from "@/lib/tiptap/tiptap-to-markdown";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch all world data in parallel
  const [allEntityTypes, allEntities, allMaps, allProjects, allDocuments, allRelations] =
    await Promise.all([
      getEntityTypesByWorld(world.id),
      db.select().from(entities).where(eq(entities.worldId, world.id)),
      getMapsByWorld(world.id),
      getWritingProjects(world.id),
      getWritingDocuments(world.id),
      getEntityRelationsByWorld(world.id),
    ]);

  const zip = new JSZip();

  // ── world.md ────────────────────────────────────────────────────────────────
  const worldLines: string[] = [`# ${world.name}`, ""];
  if (world.description) worldLines.push(world.description, "");
  worldLines.push(
    `- **Visibility:** ${world.isPublic ? "Public" : "Private"}`,
    `- **Created:** ${world.createdAt.toISOString().split("T")[0]}`,
    `- **Entity types:** ${allEntityTypes.map((t) => t.name).join(", ") || "None"}`,
    `- **Entities:** ${allEntities.length}`,
    `- **Maps:** ${allMaps.length}`,
    `- **Writing documents:** ${allDocuments.length}`
  );
  zip.file("world.md", worldLines.join("\n"));

  // ── {type-slug}/ (entity folders at root) ───────────────────────────────────
  const typeMap = new Map(allEntityTypes.map((t) => [t.id, t]));
  const entityNameMap = new Map(allEntities.map((e) => [e.id, e.name]));

  for (const entity of allEntities) {
    const type = typeMap.get(entity.entityTypeId);
    const typeFolder = type?.slug ?? "unknown";

    const lines: string[] = [
      "---",
      `name: "${entity.name.replace(/"/g, '\\"')}"`,
      `type: "${(type?.name ?? "Unknown").replace(/"/g, '\\"')}"`,
    ];

    if (entity.tags.length > 0) {
      lines.push(`tags: [${entity.tags.map((t) => `"${t}"`).join(", ")}]`);
    }

    // Custom fields in frontmatter
    const customFields = entity.customFields ?? {};
    for (const [key, value] of Object.entries(customFields)) {
      if (value !== null && value !== "") {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }

    lines.push("---", "", `# ${entity.name}`, "");

    if (entity.content) {
      const md = tiptapToMarkdown(entity.content);
      if (md) lines.push(md, "");
    }

    zip.file(`${typeFolder}/${entity.slug}.md`, lines.join("\n"));

    // Export entity image if present
    if (entity.imageUrl) {
      try {
        const blobResult = await getBlobContent(entity.imageUrl, { access: "private" });
        if (blobResult && blobResult.statusCode === 200) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const contentType = (blobResult as any).contentType ?? "image/png";
          const rawExt = contentType.split("/")[1]?.split(";")[0] ?? "png";
          const contentTypeExt = rawExt === "svg+xml" ? "svg" : rawExt;
          const urlExt = entity.imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
          const ext = (urlExt && urlExt.length <= 5) ? urlExt : contentTypeExt;
          const buffer = await new Response(blobResult.stream).arrayBuffer();
          zip.file(`${typeFolder}/${entity.slug}.${ext}`, buffer);
        }
      } catch {
        // Skip images that can't be fetched
      }
    }
  }

  // ── maps/ ───────────────────────────────────────────────────────────────────
  for (const map of allMaps) {
    if (map.imageUrl) {
      try {
        const blobResult = await getBlobContent(map.imageUrl, { access: "private" });
        if (blobResult && blobResult.statusCode === 200) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const contentType = (blobResult as any).contentType ?? "image/png";
          const rawExt = contentType.split("/")[1]?.split(";")[0] ?? "png";
          const contentTypeExt = rawExt === "svg+xml" ? "svg" : rawExt;
          // Prefer the extension from the stored filename — more reliable than content-type
          const urlExt = map.imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
          const ext = (urlExt && urlExt.length <= 5) ? urlExt : contentTypeExt;
          const buffer = await new Response(blobResult.stream).arrayBuffer();
          zip.file(`maps/${map.slug}.${ext}`, buffer);
        }
      } catch {
        // Skip maps whose images can't be fetched
      }
    }
  }

  // ── writing/ ────────────────────────────────────────────────────────────────
  const projectMap = new Map(allProjects.map((p) => [p.id, p]));

  for (const doc of allDocuments) {
    const project = doc.projectId ? projectMap.get(doc.projectId) : null;
    const folder = project ? `writing/${project.slug}` : "writing";

    const lines: string[] = ["---", `title: "${doc.title.replace(/"/g, '\\"')}"`];
    if (doc.wordCount) lines.push(`word_count: ${doc.wordCount}`);
    if (doc.wordTarget) lines.push(`word_target: ${doc.wordTarget}`);
    lines.push("---", "", `# ${doc.title}`, "");

    if (doc.content) {
      const md = tiptapToMarkdown(doc.content);
      if (md) lines.push(md, "");
    }

    zip.file(`${folder}/${doc.slug}.md`, lines.join("\n"));
  }

  // ── relationships.md ────────────────────────────────────────────────────────
  if (allRelations.length > 0) {
    const lines: string[] = [
      "# Relationships",
      "",
      "| From | Relationship | To |",
      "| ---- | ------------ | -- |",
    ];
    for (const rel of allRelations) {
      const from = entityNameMap.get(rel.sourceEntityId) ?? rel.sourceEntityId;
      const to = entityNameMap.get(rel.targetEntityId) ?? rel.targetEntityId;
      lines.push(`| ${from} | ${rel.label} | ${to} |`);
    }
    zip.file("relationships.md", lines.join("\n"));
  }

  // ── Generate zip ────────────────────────────────────────────────────────────
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const safeName = world.slug;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-export.zip"`,
    },
  });
}
