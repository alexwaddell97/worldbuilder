import { notFound } from "next/navigation";
import { getPublicWorldBySlug, getPublicEntityTypes } from "@/lib/db/queries/public";
import { PublicWorldSidebar } from "@/components/public/public-world-sidebar";
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
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `url(${blobDisplayUrl(world.backgroundImageUrl)})`,
            backgroundSize: "100% auto",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
            maskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            opacity: 0.45,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
      )}

      <PublicWorldSidebar
        worldSlug={worldSlug}
        worldName={world.name}
        worldImageUrl={world.imageUrl}
        entityTypes={entityTypes}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
