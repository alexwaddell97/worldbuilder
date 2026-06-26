import { notFound } from "next/navigation";
import { getPublicWorldBySlug, getPublicMapWithPins, getPublicRootMaps, getPublicAllEntitiesWithTypes, getPublicMapBySlug } from "@/lib/db/queries/public";
import { MapViewer } from "@/components/maps/map-viewer";

export const dynamic = "force-dynamic";

export default async function PublicMapDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ worldSlug: string; mapSlug: string }>;
  searchParams: Promise<{ trail?: string }>;
}) {
  const { worldSlug, mapSlug } = await params;
  const { trail: trailParam } = await searchParams;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const [map, allMaps, allEntities] = await Promise.all([
    getPublicMapWithPins(world.id, mapSlug),
    getPublicRootMaps(world.id),
    getPublicAllEntitiesWithTypes(world.id),
  ]);

  if (!map) notFound();

  const trailSlugs = trailParam ? trailParam.split(",").filter(Boolean) : [];
  const trailMaps = await Promise.all(
    trailSlugs.map(async (s) => {
      const m = await getPublicMapBySlug(world.id, s);
      return m ? { slug: s, name: m.name } : null;
    })
  );
  const trail = trailMaps.filter((m): m is { slug: string; name: string } => m !== null);

  const mapsBasePath = `/w/${worldSlug}/maps`;

  return (
    <div className="h-full w-full overflow-hidden">
      <MapViewer
        map={map}
        worldId={world.id}
        worldSlug={world.slug}
        allEntities={allEntities}
        allMaps={allMaps}
        trail={trail}
        readOnly
        mapsBasePath={mapsBasePath}
      />
    </div>
  );
}
