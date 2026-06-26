import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[
        { label: world.name, href: basePath },
        { label: "Stories" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Stories</h1>

      <PublicStoriesView groups={groups} basePath={basePath} hasProjects={hasProjects} />
    </div>
  );
}
