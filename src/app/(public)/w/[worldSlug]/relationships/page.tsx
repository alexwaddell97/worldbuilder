import { notFound } from "next/navigation";
import { getPublicWorldBySlug, getPublicAllEntitiesWithTypes, getPublicEntityRelations } from "@/lib/db/queries/public";
import { extractWikilinks } from "@/lib/relationships/extract-wikilinks";
import { RelationshipGraphLoader } from "@/components/relationships/relationship-graph-loader";
import type { GraphNode, GraphEdge, GraphRelation } from "@/components/relationships/relationship-graph";

export const dynamic = "force-dynamic";

export default async function PublicRelationshipsPage({
  params,
}: {
  params: Promise<{ worldSlug: string }>;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const [allEntities, rawRelations] = await Promise.all([
    getPublicAllEntitiesWithTypes(world.id),
    getPublicEntityRelations(world.id),
  ]);

  const entityIds = new Set(allEntities.map((e) => e.id));
  const basePath = `/w/${worldSlug}`;

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

  const relations: GraphRelation[] = rawRelations
    .filter((r) => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId))
    .map((r) => ({ id: r.id, sourceEntityId: r.sourceEntityId, targetEntityId: r.targetEntityId, label: r.label }));

  const allTags = [...new Set(allEntities.flatMap((e) => e.tags))].sort();

  const nodes: GraphNode[] = allEntities.map((entity) => ({
    id: entity.id,
    position: { x: 0, y: 0 },
    type: "entity" as const,
    data: {
      label: entity.name,
      entityTypeIcon: entity.entityType.icon,
      entityTypeName: entity.entityType.name,
      href: `${basePath}/entities/${entity.entityType.slug}/${entity.slug}`,
      tags: entity.tags,
      entity,
      entityType: entity.entityType,
    },
  }));

  return (
    <div className="h-full w-full overflow-hidden">
      <RelationshipGraphLoader
        worldId={world.id}
        worldSlug={world.slug}
        worldName={world.name}
        nodes={nodes}
        wikiEdges={wikiEdges}
        relations={relations}
        allTags={allTags}
        initialSettings={null}
        readOnly
      />
    </div>
  );
}
