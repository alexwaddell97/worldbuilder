import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypeBySlug } from "@/lib/db/queries/entity-types";
import { getEntityBySlug } from "@/lib/db/queries/entities";
import { getEntityRelationsByEntity } from "@/lib/db/queries/relations";
import type { CustomFieldValues } from "@/lib/db/schema";
import { TiptapEditor } from "@/components/tiptap/tiptap-editor";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EntityInlineMetadata } from "@/components/entities/entity-inline-metadata";
import { ConnectionsInfoIcon } from "@/components/entities/connections-info-icon";
import { blobDisplayUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
    "type-slug": string;
    "entity-slug": string;
  }>;
}) {
  const {
    slug,
    "type-slug": typeSlug,
    "entity-slug": entitySlug,
  } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entityType = await getEntityTypeBySlug(world.id, typeSlug);
  if (!entityType) notFound();

  const entity = await getEntityBySlug(world.id, entitySlug);
  if (!entity) notFound();

  const relationships = await getEntityRelationsByEntity(entity.id, world.id);

  const customFieldValues = entity.customFields as CustomFieldValues;
  const fieldsWithValues = entityType.customFieldsSchema.fields.filter(
    (f) =>
      customFieldValues[f.key] !== undefined &&
      customFieldValues[f.key] !== null &&
      customFieldValues[f.key] !== ""
  );

  return (
    <div className="p-8 min-h-full flex flex-col">
      <Breadcrumb items={[
        { label: "Your Worlds", href: "/dashboard" },
        { label: world.name, href: `/worlds/${slug}` },
        { label: entityType.name, href: `/worlds/${slug}/entities/${typeSlug}` },
        { label: entity.name },
      ]} />

      <EntityInlineMetadata
        entity={entity}
        entityType={entityType}
        worldId={world.id}
        worldSlug={slug}
        isPublicWorld={world.isPublic}
      />

      {relationships.length > 0 && (
        <div className="mb-6 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">Connections <ConnectionsInfoIcon /></p>
          <div className="flex flex-wrap gap-2">
            {relationships.map((rel) => {
              const href = `/worlds/${slug}/entities/${rel.otherEntityTypeSlug}/${rel.otherEntitySlug}`;
              return (
                <Link
                  key={rel.id}
                  href={href}
                  className="inline-flex items-center gap-1 text-sm border border-border rounded-full px-3 py-0.5 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {rel.direction === "target" && (
                    <span className="text-xs opacity-50 -ml-0.5">←</span>
                  )}
                  <span className="font-medium text-foreground/80">{rel.label}</span>
                  <span className="opacity-60">·</span>
                  <span>{rel.otherEntityName}</span>
                  {rel.direction === "source" && (
                    <span className="text-xs opacity-50 -mr-0.5">→</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <TiptapEditor
          entityId={entity.id}
          worldId={world.id}
          worldSlug={slug}
          initialContent={entity.content}
        />
      </div>
    </div>
  );
}
