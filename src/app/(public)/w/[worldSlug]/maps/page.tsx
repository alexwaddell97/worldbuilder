import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { getPublicWorldBySlug, getPublicRootMaps } from "@/lib/db/queries/public";
import { FadeImage } from "@/components/ui/fade-image";
import { blobDisplayUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicMapsPage({
  params,
}: {
  params: Promise<{ worldSlug: string }>;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const rootMaps = await getPublicRootMaps(world.id);
  const basePath = `/w/${worldSlug}`;

  if (rootMaps.length === 1) {
    redirect(`${basePath}/maps/${rootMaps[0].slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">{world.name}</Link>
        {" / "}
        <span>Maps</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">Maps</h1>

      {rootMaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <MapIcon size={36} strokeWidth={1} />
          <p className="text-sm">No maps yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rootMaps.map((map) => (
            <Link
              key={map.id}
              href={`${basePath}/maps/${map.slug}`}
              className="group rounded-xl border border-border overflow-hidden bg-card hover:shadow-sm transition-shadow"
            >
              <div className="relative h-36 bg-muted">
                {map.imageUrl ? (
                  <FadeImage src={blobDisplayUrl(map.imageUrl)} alt={map.name} className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <MapIcon size={32} strokeWidth={1} className="text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium group-hover:underline underline-offset-4">{map.name}</p>
                {map.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{map.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
