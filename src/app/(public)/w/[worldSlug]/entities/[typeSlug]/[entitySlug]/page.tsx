import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getPublicWorldBySlug, getPublicEntityTypeBySlug, getPublicEntityBySlug } from "@/lib/db/queries/public";
import { getPublicEntityRelationsByEntity } from "@/lib/db/queries/relations";
import { ConnectionsInfoIcon } from "@/components/entities/connections-info-icon";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FadeImage } from "@/components/ui/fade-image";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { PublicStoryView } from "@/components/public/public-story-view";
import { blobDisplayUrl, pluralize } from "@/lib/utils";
import type { CustomFieldValues } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PublicEntityDetailPage({
  params,
}: {
  params: Promise<{ worldSlug: string; typeSlug: string; entitySlug: string }>;
}) {
  const { worldSlug, typeSlug, entitySlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const entityType = await getPublicEntityTypeBySlug(world.id, typeSlug);
  if (!entityType) notFound();

  const entity = await getPublicEntityBySlug(world.id, entitySlug);
  if (!entity || entity.entityType.slug !== typeSlug) notFound();

  const relationships = await getPublicEntityRelationsByEntity(entity.id, world.id);
  const basePath = `/w/${worldSlug}`;
  const typeName = entityType.namePlural ?? pluralize(entityType.name);
  const customFieldValues = entity.customFields as CustomFieldValues;
  const fieldsWithValues = entityType.customFieldsSchema.fields.filter(
    (f) =>
      customFieldValues[f.key] !== undefined &&
      customFieldValues[f.key] !== null &&
      customFieldValues[f.key] !== ""
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[
        { label: world.name, href: basePath },
        { label: typeName, href: `${basePath}/entities/${typeSlug}` },
        { label: entity.name },
      ]} />

      {/* Header: square image + identity block */}
      <div className="flex gap-5 mt-6">
        {entity.imageUrl && (
          <div className="shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-muted relative">
            <FadeImage
              src={blobDisplayUrl(entity.imageUrl)}
              alt={entity.name}
              className="object-cover"
              style={entity.imagePosition ? { objectPosition: entity.imagePosition } : undefined}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-2xl font-bold leading-tight">{entity.name}</h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
            <DynamicIcon name={entityType.icon ?? ""} size={13} />
            <span className="text-sm">{entityType.name}</span>
          </div>

          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entity.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {fieldsWithValues.length > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              {fieldsWithValues.map((field) => {
                const value = customFieldValues[field.key];
                return (
                  <div key={field.key}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{field.label}</p>
                    <p className="text-sm">{field.type === "boolean" ? (value ? "Yes" : "No") : String(value)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {relationships.length > 0 && (
        <>
          <Separator className="my-5" />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">Connections <ConnectionsInfoIcon /></p>
            <div className="flex flex-wrap gap-2">
              {relationships.map((rel) => {
                const href = `${basePath}/entities/${rel.otherEntityTypeSlug}/${rel.otherEntitySlug}`;
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
        </>
      )}

      <Separator className="my-5" />

      <PublicStoryView content={entity.content} worldId={world.id} />
    </div>
  );
}
