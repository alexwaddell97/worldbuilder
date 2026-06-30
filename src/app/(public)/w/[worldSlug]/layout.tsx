import { notFound } from "next/navigation";
import { getPublicWorldBySlug, getPublicEntityTypes } from "@/lib/db/queries/public";
import { PublicWorldSidebar } from "@/components/public/public-world-sidebar";
import { PublicMobileHeader } from "@/components/public/public-mobile-header";
import { SearchCommand } from "@/components/search/search-command";
import { blobDisplayUrl } from "@/lib/utils";

export default async function PublicWorldLayout({
  params,
  children,
}: {
  params: Promise<{ worldSlug: string }>;
  children: React.ReactNode;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const entityTypes = await getPublicEntityTypes(world.id);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background image */}
      {world.backgroundImageUrl && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-bottom bg-no-repeat bg-cover sm:bg-size-[100%_auto] pointer-events-none -z-10"
          style={{
            backgroundImage: `url(${blobDisplayUrl(world.backgroundImageUrl)})`,
            maskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            opacity: 0.45,
          }}
        />
      )}

      <PublicWorldSidebar
        worldSlug={worldSlug}
        worldName={world.name}
        worldImageUrl={world.imageUrl}
        entityTypes={entityTypes}
      />
      <div className="flex-1 flex flex-col min-h-0">
        <PublicMobileHeader
          worldSlug={worldSlug}
          worldName={world.name}
          worldImageUrl={world.imageUrl}
          entityTypes={entityTypes}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <SearchCommand
        searchApiUrl={`/api/public/${worldSlug}/search`}
        entityBasePath={`/w/${worldSlug}`}
        writingPath="stories"
      />
    </div>
  );
}
