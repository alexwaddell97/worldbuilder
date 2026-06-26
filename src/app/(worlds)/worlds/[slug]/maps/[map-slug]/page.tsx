import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getMapWithPins, getMapsByWorld, getMapBySlug } from "@/lib/db/queries/maps";
import { getAllEntitiesWithTypesByWorld } from "@/lib/db/queries/entities";
import { MapViewer } from "@/components/maps/map-viewer";

export const dynamic = "force-dynamic";

export default async function MapDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; "map-slug": string }>;
  searchParams: Promise<{ trail?: string }>;
}) {
  const { slug, "map-slug": mapSlug } = await params;
  const { trail: trailParam } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const [map, allMaps, allEntities] = await Promise.all([
    getMapWithPins(mapSlug, world.id),
    getMapsByWorld(world.id),
    getAllEntitiesWithTypesByWorld(world.id),
  ]);

  if (!map) notFound();

  // Resolve trail slugs → { slug, name } for the breadcrumb
  const trailSlugs = trailParam ? trailParam.split(",").filter(Boolean) : [];
  const trailMaps = await Promise.all(
    trailSlugs.map(async (s) => {
      const m = await getMapBySlug(s, world.id);
      return m ? { slug: s, name: m.name } : null;
    })
  );
  const trail = trailMaps.filter((m): m is { slug: string; name: string } => m !== null);

  return (
    <div className="h-full w-full overflow-hidden">
      <MapViewer
        map={map}
        worldId={world.id}
        worldSlug={slug}
        allEntities={allEntities}
        allMaps={allMaps}
        trail={trail}
        isPublicWorld={world.isPublic}
      />
    </div>
  );
}
