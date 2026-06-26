import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicWorldBySlug, getPublishedStoryBySlug } from "@/lib/db/queries/public";
import { PublicStoryView } from "@/components/public/public-story-view";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PublicStoryPage({
  params,
}: {
  params: Promise<{ worldSlug: string; docSlug: string }>;
}) {
  const { worldSlug, docSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const story = await getPublishedStoryBySlug(world.id, docSlug);
  if (!story) notFound();

  const basePath = `/w/${worldSlug}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">{world.name}</Link>
        {" / "}
        <Link href={`${basePath}/stories`} className="hover:text-foreground transition-colors">Stories</Link>
        {" / "}
        <span className="text-foreground">{story.title}</span>
      </div>

      <h1 className="text-3xl font-bold leading-tight">{story.title}</h1>
      <p className="text-sm text-muted-foreground mt-3">
        {formatDate(new Date(story.updatedAt))}
        {story.wordCount > 0 && (
          <> · {story.wordCount.toLocaleString()} {story.wordCount === 1 ? "word" : "words"}</>
        )}
      </p>

      <Separator className="mt-8 mb-10" />

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <PublicStoryView content={story.content} worldId={world.id} />
      </article>
    </div>
  );
}
