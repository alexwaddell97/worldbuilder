import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getWritingProjects, getWritingDocuments } from "@/lib/db/queries/writing";
import { WritingSidebar } from "@/components/writing/writing-sidebar";
import { WritingMobileHeader } from "@/components/writing/writing-mobile-header";

export const dynamic = "force-dynamic";

export default async function WritingLayout({
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

  const [projects, documents] = await Promise.all([
    getWritingProjects(world.id),
    getWritingDocuments(world.id),
  ]);

  return (
    <div className="flex h-full overflow-hidden">
      <WritingSidebar
        worldId={world.id}
        worldSlug={slug}
        projects={projects}
        documents={documents}
      />
      <div className="flex-1 overflow-hidden flex flex-col bg-background/40 backdrop-blur-sm">
        <WritingMobileHeader
          worldId={world.id}
          worldSlug={slug}
          projects={projects}
          documents={documents}
        />
        {children}
      </div>
    </div>
  );
}
