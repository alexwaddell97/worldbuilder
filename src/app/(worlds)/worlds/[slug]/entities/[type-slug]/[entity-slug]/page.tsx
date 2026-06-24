import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypeBySlug } from "@/lib/db/queries/entity-types";
import { getEntityBySlug } from "@/lib/db/queries/entities";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { EntityDetailActions } from "@/components/entities/entity-detail-actions";
import type { CustomFieldValues } from "@/lib/db/schema";

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
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{entity.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <DynamicIcon
              name={entityType.icon ?? ""}
              size={14}
              className="text-muted-foreground"
            />
            <span className="text-sm text-muted-foreground">
              {entityType.name}
            </span>
          </div>
        </div>
        <EntityDetailActions
          entity={entity}
          entityType={entityType}
          worldId={world.id}
        />
      </div>

      {/* Tags */}
      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {entity.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Content placeholder (Phase 4 will replace this with Tiptap editor) */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground mb-6">
        Rich text editor will appear here in Phase 4.
      </div>

      {/* Custom fields */}
      {fieldsWithValues.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-foreground mb-3">
            Custom fields
          </h2>
          <div className="space-y-3">
            {fieldsWithValues.map((field) => {
              const value = customFieldValues[field.key];
              return (
                <div key={field.key} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    {field.label}
                  </span>
                  <span className="text-sm text-foreground">
                    {field.type === "boolean"
                      ? value
                        ? "Yes"
                        : "No"
                      : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
