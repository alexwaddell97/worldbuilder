import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";
import { Sidebar } from "@/components/layout/sidebar";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
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
          className="fixed inset-0 bg-cover sm:bg-size-[100%_auto] bg-bottom bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url(${blobDisplayUrl(world.backgroundImageUrl)})`,
            maskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 20%, transparent 60%)",
            opacity: 0.55,
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
      <div className="flex-1 flex flex-col min-h-0">
        <AppMobileHeader
          worldSlug={slug}
          worldName={world.name}
          worldImageUrl={world.imageUrl}
          worldEntityTypes={entityTypes}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
