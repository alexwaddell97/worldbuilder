import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";
import { Sidebar } from "@/components/layout/sidebar";
import { blobDisplayUrl } from "@/lib/utils";

export default async function WorldLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entityTypes = await getEntityTypesByWorld(world.id);

  return (
    <div className="flex h-screen overflow-hidden">
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
            opacity: 0.55,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
      )}
      <Sidebar
        worldSlug={slug}
        worldName={world.name}
        worldImageUrl={world.imageUrl}
        worldEntityTypes={entityTypes}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
