import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getAllEntitiesWithTypesByWorld } from "@/lib/db/queries/entities";
import { getEntityRelationsByWorld } from "@/lib/db/queries/relations";
import { getGraphSettings } from "@/lib/db/queries/graph-settings";
import { extractWikilinks } from "@/lib/relationships/extract-wikilinks";
import { RelationshipGraphLoader } from "@/components/relationships/relationship-graph-loader";
import type { GraphNode, GraphEdge, GraphRelation } from "@/components/relationships/relationship-graph";

export const dynamic = "force-dynamic";

export default async function RelationshipsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const [allEntities, rawRelations, graphSettings] = await Promise.all([
    getAllEntitiesWithTypesByWorld(world.id),
    getEntityRelationsByWorld(world.id),
    getGraphSettings(world.id),
  ]);

  const entityIds = new Set(allEntities.map((e) => e.id));

  // Build wikilink edges (deduplicated, valid, no self-links)
  const edgeSet = new Set<string>();
  const wikiEdges: GraphEdge[] = [];

  for (const entity of allEntities) {
    const linkedIds = extractWikilinks(entity.content);
    for (const targetId of linkedIds) {
      if (targetId === entity.id) continue;
      if (!entityIds.has(targetId)) continue;
      const key = `${entity.id}→${targetId}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      wikiEdges.push({ id: key, source: entity.id, target: targetId });
    }
  }

  // Filter relations to valid entities only
  const relations: GraphRelation[] = rawRelations
    .filter((r) => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId))
    .map((r) => ({ id: r.id, sourceEntityId: r.sourceEntityId, targetEntityId: r.targetEntityId, label: r.label }));

  // Connected entities: appear in any edge (wikilink or explicit relation)
  const connectedIds = new Set<string>();
  for (const e of wikiEdges) { connectedIds.add(e.source); connectedIds.add(e.target); }
  for (const r of relations) { connectedIds.add(r.sourceEntityId); connectedIds.add(r.targetEntityId); }

  // All entities go in the graph (not just connected) since users draw relations here
  // Connected-only was the old behaviour; now all entities show so you can draw new links
  const nodes: GraphNode[] = allEntities.map((entity) => ({
    id: entity.id,
    position: { x: 0, y: 0 },
    type: "entity" as const,
    data: {
      label: entity.name,
      entityTypeIcon: entity.entityType.icon,
      entityTypeName: entity.entityType.name,
      href: `/worlds/${slug}/entities/${entity.entityType.slug}/${entity.slug}`,
      tags: entity.tags,
      entity,
      entityType: entity.entityType,
    },
  }));

  // All unique tags across the world (for the group-by control)
  const allTags = [...new Set(allEntities.flatMap((e) => e.tags))].sort();

  const connectedCount = new Set([
    ...wikiEdges.flatMap((e) => [e.source, e.target]),
    ...relations.flatMap((r) => [r.sourceEntityId, r.targetEntityId]),
  ]).size;

  return (
    <div className="h-full w-full overflow-hidden">
      <RelationshipGraphLoader
        worldId={world.id}
        worldSlug={slug}
        worldName={world.name}
        nodes={nodes}
        wikiEdges={wikiEdges}
        relations={relations}
        allTags={allTags}
        initialSettings={graphSettings ? {
          nodePositions: graphSettings.nodePositions,
          hiddenEntityIds: graphSettings.hiddenEntityIds,
          hiddenTypeIds: graphSettings.hiddenTypeIds,
        } : null}
      />
    </div>
  );
}
