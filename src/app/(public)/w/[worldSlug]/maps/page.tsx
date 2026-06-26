import { notFound, redirect } from "next/navigation";
import { getPublicWorldBySlug, getPublicMaps } from "@/lib/db/queries/public";
import { MapsIndexClient } from "@/components/maps/maps-index-client";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function PublicMapsPage({
  params,
}: {
  params: Promise<{ worldSlug: string }>;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const allMaps = await getPublicMaps(world.id);
  const basePath = `/w/${worldSlug}`;

  if (allMaps.length === 1) {
    redirect(`${basePath}/maps/${allMaps[0].slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[
        { label: world.name, href: basePath },
        { label: "Maps" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Maps</h1>

      <MapsIndexClient
        maps={allMaps}
        worldId={world.id}
        worldSlug={worldSlug}
        basePath={`${basePath}/maps`}
      />
    </div>
  );
}
