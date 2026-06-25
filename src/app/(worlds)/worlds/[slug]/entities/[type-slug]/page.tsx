import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypeBySlug } from "@/lib/db/queries/entity-types";
import { getEntitiesByType } from "@/lib/db/queries/entities";
import { EntityListView } from "@/components/entities/entity-list-view";
import { CreateEntityDialog } from "@/components/entities/create-entity-dialog";
import { EntityListFilters } from "@/components/entities/entity-list-filters";
import { pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EntityListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; "type-slug": string }>;
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { slug, "type-slug": typeSlug } = await params;
  const { q, tag } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entityType = await getEntityTypeBySlug(world.id, typeSlug);
  if (!entityType) notFound();

  const filteredEntities = await getEntitiesByType(world.id, entityType.id, {
    search: q,
    tag,
  });

  // Load all entities to derive available tags for the filter popover
  const allEntities = await getEntitiesByType(world.id, entityType.id);
  const availableTags = [
    ...new Set(allEntities.flatMap((e) => e.tags)),
  ].sort();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{pluralize(entityType.name)}</h1>
        <CreateEntityDialog worldId={world.id} entityType={entityType} />
      </div>

      {/* Filter row */}
      <EntityListFilters
        typeSlug={typeSlug}
        worldSlug={slug}
        typeName={entityType.name}
        currentSearch={q}
        currentTag={tag}
        availableTags={availableTags}
      />

      {/* Entity list */}
      {filteredEntities.length > 0 ? (
        <EntityListView
          entities={filteredEntities}
          entityType={entityType}
          worldSlug={slug}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm font-medium text-foreground">
            {q || tag
              ? `No ${pluralize(entityType.name)} match your filters`
              : `No ${pluralize(entityType.name)} yet`}
          </p>
          <p className="text-sm text-muted-foreground">
            {q || tag
              ? "Try adjusting your search or clearing the filter."
              : `Create your first ${entityType.name} to start building your world.`}
          </p>
          {!q && !tag && (
            <CreateEntityDialog worldId={world.id} entityType={entityType} />
          )}
        </div>
      )}
    </div>
  );
}
