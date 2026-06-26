import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getPublicWorldBySlug, getPublicEntityTypeBySlug, getPublicEntityBySlug } from "@/lib/db/queries/public";
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

      {entity.imageUrl && (
        <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6 bg-muted">
          <FadeImage
            src={blobDisplayUrl(entity.imageUrl)}
            alt={entity.name}
            className="object-cover"
            style={entity.imagePosition ? { objectPosition: entity.imagePosition } : undefined}
          />
        </div>
      )}

      <h1 className="text-2xl font-bold">{entity.name}</h1>
      <div className="flex items-center gap-1.5 mt-1 mb-3 text-muted-foreground">
        <DynamicIcon name={entityType.icon ?? ""} size={13} />
        <span className="text-sm">{entityType.name}</span>
      </div>

      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {entity.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {fieldsWithValues.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
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
        </>
      )}

      <Separator className="my-4" />

      <PublicStoryView content={entity.content} worldId={world.id} />
    </div>
  );
}
