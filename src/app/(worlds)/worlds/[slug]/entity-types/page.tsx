import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { CreateEntityTypeDialog } from "@/components/entity-types/create-entity-type-dialog";
import { EntityTypeRowActions } from "@/components/entity-types/entity-type-row-actions";

export const dynamic = "force-dynamic";

export default async function EntityTypesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entityTypes = await getEntityTypesByWorld(world.id);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Entity Types</h1>
        <CreateEntityTypeDialog worldId={world.id} />
      </div>

      <div className="space-y-2">
        {entityTypes.map((type) => (
          <div
            key={type.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <DynamicIcon
                name={type.icon ?? ""}
                size={18}
                className="text-muted-foreground shrink-0"
              />
              <div>
                <span className="text-sm font-medium">{type.name}</span>
                <span className="block text-xs text-muted-foreground font-mono">
                  /{type.slug}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {type.isBuiltIn ? (
                <Badge variant="secondary">Built-in</Badge>
              ) : (
                <EntityTypeRowActions entityType={type} worldId={world.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
