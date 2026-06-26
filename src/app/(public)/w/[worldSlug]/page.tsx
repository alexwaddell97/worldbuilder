import { notFound } from "next/navigation";
import Link from "next/link";
import { MapIcon, Network, BookOpen } from "lucide-react";
import { getPublicWorldBySlug, getPublicEntityTypes } from "@/lib/db/queries/public";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { FadeImage } from "@/components/ui/fade-image";
import { blobDisplayUrl, pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicWorldPage({
  params,
}: {
  params: Promise<{ worldSlug: string }>;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const entityTypes = await getPublicEntityTypes(world.id);
  const basePath = `/w/${worldSlug}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-10">
        {world.imageUrl && (
          <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6 bg-muted">
            <FadeImage
              src={blobDisplayUrl(world.imageUrl)}
              alt={world.name}
              className="object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{world.name}</h1>
        {world.description && (
          <p className="text-muted-foreground mt-2 max-w-prose">{world.description}</p>
        )}
      </div>

      {/* Entity types */}
      {entityTypes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Explore</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {entityTypes.map((et) => (
              <Link
                key={et.id}
                href={`${basePath}/entities/${et.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-center"
              >
                <DynamicIcon name={et.icon ?? ""} size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium">{et.namePlural ?? pluralize(et.name)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section>
        <h2 className="text-lg font-semibold mb-4">More</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`${basePath}/maps`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <MapIcon size={16} className="text-muted-foreground" />
            Maps
          </Link>
          <Link
            href={`${basePath}/relationships`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <Network size={16} className="text-muted-foreground" />
            Relationships
          </Link>
          <Link
            href={`${basePath}/stories`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
          >
            <BookOpen size={16} className="text-muted-foreground" />
            Stories
          </Link>
        </div>
      </section>
    </div>
  );
}
