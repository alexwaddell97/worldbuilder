import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicWorldBySlug, getPublishedStories } from "@/lib/db/queries/public";
import { PublicStoriesView } from "@/components/public/public-stories-view";

export const dynamic = "force-dynamic";

export default async function PublicStoriesPage({
  params,
}: {
  params: Promise<{ worldSlug: string }>;
}) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const stories = await getPublishedStories(world.id);
  const basePath = `/w/${worldSlug}`;

  const groups: { projectId: string | null; projectName: string | null; stories: typeof stories }[] = [];
  const seenProjects = new Map<string | null, number>();

  for (const story of stories) {
    const key = story.projectId ?? null;
    if (!seenProjects.has(key)) {
      seenProjects.set(key, groups.length);
      groups.push({ projectId: key, projectName: story.project?.name ?? null, stories: [] });
    }
    groups[seenProjects.get(key)!].stories.push(story);
  }

  const hasProjects = groups.some((g) => g.projectId !== null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-2 text-sm text-muted-foreground">
        <Link href={basePath} className="hover:text-foreground transition-colors">{world.name}</Link>
        {" / "}
        <span>Stories</span>
      </div>
      <h1 className="text-2xl font-bold mb-8">Stories</h1>

      <PublicStoriesView groups={groups} basePath={basePath} hasProjects={hasProjects} />
    </div>
  );
}
