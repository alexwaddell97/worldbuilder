import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getMapsByWorld } from "@/lib/db/queries/maps";
import { CreateMapDialog } from "@/components/maps/create-map-dialog";
import { MapsIndexClient } from "@/components/maps/maps-index-client";
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

  const worldMaps = await getMapsByWorld(world.id);

  // Single map — go straight to it
  if (worldMaps.length === 1) {
    redirect(`/worlds/${slug}/maps/${worldMaps[0].slug}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Breadcrumb items={[
        { label: "Your Worlds", href: "/dashboard" },
        { label: world.name, href: `/worlds/${slug}` },
        { label: "Maps" },
      ]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maps</h1>
        </div>
        {worldMaps.length > 0 && (
          <CreateMapDialog worldId={world.id} worldSlug={slug} allMaps={worldMaps} />
        )}
      </div>

      <MapsIndexClient
        maps={worldMaps}
        worldId={world.id}
        worldSlug={slug}
        basePath={`/worlds/${slug}/maps`}
      />
    </div>
  );
}
