import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicWorldBySlug,
  getPublicEntityTypeBySlug,
  getPublicEntitiesByType,
} from "@/lib/db/queries/public";
import { FadeImage } from "@/components/ui/fade-image";
import { Badge } from "@/components/ui/badge";
import { blobDisplayUrl, pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicEntityListPage({
  params,
}: {
  params: Promise<{ worldSlug: string; typeSlug: string }>;
}) {
  const { worldSlug, typeSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const entityType = await getPublicEntityTypeBySlug(world.id, typeSlug);
  if (!entityType) notFound();

  const entities = await getPublicEntitiesByType(world.id, entityType.id);
  const basePath = `/w/${worldSlug}`;
  const typeName = entityType.namePlural ?? pluralize(entityType.name);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">{world.name}</Link>
        {" / "}
        <span>{typeName}</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">{typeName}</h1>

      {entities.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {typeName.toLowerCase()} yet.</p>
      ) : (
        <div className="grid gap-3">
          {entities.map((entity) => (
            <Link
              key={entity.id}
              href={`${basePath}/entities/${typeSlug}/${entity.slug}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              {entity.imageUrl ? (
                <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
                  <FadeImage
                    src={blobDisplayUrl(entity.imageUrl)}
                    alt={entity.name}
                    className="object-cover"
                    style={entity.imagePosition ? { objectPosition: entity.imagePosition } : undefined}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted shrink-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-muted-foreground/40">
                    {entity.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entity.name}</p>
                {entity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entity.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {entity.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{entity.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
