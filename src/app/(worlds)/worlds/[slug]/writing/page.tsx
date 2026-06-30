import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { createWritingDocumentAction } from "@/lib/actions/writing";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getWritingDocuments } from "@/lib/db/queries/writing";

export const dynamic = "force-dynamic";

export default async function WritingIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  // If there are existing documents, redirect to the most recent one
  const documents = await getWritingDocuments(world.id);
  if (documents.length > 0) {
    const latest = documents.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    redirect(`/worlds/${slug}/writing/${latest.slug}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <DynamicIcon name="gi:quill" size={40} />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="text-sm mt-1">Create your first document to start writing.</p>
      </div>
      <form action={createWritingDocumentAction.bind(null, world.id, slug, null)}>
        <button
          type="submit"
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <DynamicIcon name="gi:quill" size={15} />
          New document
        </button>
      </form>
    </div>
  );
}
