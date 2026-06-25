import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getMapsByWorld, getRootMapsByWorld } from "@/lib/db/queries/maps";
import { CreateMapDialog } from "@/components/maps/create-map-dialog";
import Link from "next/link";
import { Map as MapIcon, ImageOff } from "lucide-react";
import { blobDisplayUrl } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function MapsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const worldMaps = await getRootMapsByWorld(world.id);

  // Single root map — go straight to it; user can create more from the viewer
  if (worldMaps.length === 1) {
    redirect(`/worlds/${slug}/maps/${worldMaps[0].slug}`);
  }

  return (
    <div className="p-8">
      <Breadcrumb items={[
        { label: "Your Worlds", href: "/dashboard" },
        { label: world.name, href: `/worlds/${slug}` },
        { label: "Maps" },
      ]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maps</h1>
          {worldMaps.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {worldMaps.length} {worldMaps.length === 1 ? "map" : "maps"}
            </p>
          )}
        </div>
        <CreateMapDialog worldId={world.id} worldSlug={slug} />
      </div>

      {worldMaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <MapIcon size={40} strokeWidth={1} />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No maps yet</p>
            <p className="text-sm mt-1">
              Create a map and pin entities to bring your world to life.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {worldMaps.map((map) => (
            <Link
              key={map.id}
              href={`/worlds/${slug}/maps/${map.slug}`}
              className="group rounded-xl border border-border overflow-hidden bg-card hover:shadow-sm transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-muted flex items-center justify-center">
                {map.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={blobDisplayUrl(map.imageUrl)}
                    alt={map.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MapIcon
                    size={32}
                    strokeWidth={1}
                    className="text-muted-foreground/40"
                  />
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-medium group-hover:underline underline-offset-4">
                  {map.name}
                </p>
                {map.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {map.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
