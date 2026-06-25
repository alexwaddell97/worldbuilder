import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypeBySlug } from "@/lib/db/queries/entity-types";
import { getEntityBySlug } from "@/lib/db/queries/entities";
import type { CustomFieldValues } from "@/lib/db/schema";
import { TiptapEditor } from "@/components/tiptap/tiptap-editor";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EntityInlineMetadata } from "@/components/entities/entity-inline-metadata";
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
      />

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
