import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getWritingDocument } from "@/lib/db/queries/writing";
import { WritingEditorLoader } from "@/components/writing/writing-editor-loader";

export const dynamic = "force-dynamic";

export default async function WritingDocumentPage({
  params,
}: {
  params: Promise<{ slug: string; "doc-slug": string }>;
}) {
  const { slug, "doc-slug": docSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const doc = await getWritingDocument(docSlug, world.id);
  if (!doc) notFound();

  return (
    <WritingEditorLoader
      docId={doc.id}
      worldId={world.id}
      worldSlug={slug}
      initialTitle={doc.title}
      initialContent={doc.content}
      initialUpdatedAt={doc.updatedAt}
      initialWordCount={doc.wordCount}
      initialWordTarget={doc.wordTarget}
    />
  );
}
