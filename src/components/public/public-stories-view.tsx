"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Story {
  id: string;
  title: string;
  slug: string;
  wordCount: number;
  updatedAt: Date | string;
}

interface StoryGroup {
  projectId: string | null;
  projectName: string | null;
  stories: Story[];
}

interface PublicStoriesViewProps {
  groups: StoryGroup[];
  basePath: string;
  hasProjects: boolean;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function PublicStoriesView({ groups, basePath, hasProjects }: PublicStoriesViewProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = groups
    .map((group) => ({
      ...group,
      stories: q
        ? group.stories.filter((s) => s.title.toLowerCase().includes(q))
        : group.stories,
    }))
    .filter((group) => group.stories.length > 0);

  const totalStories = groups.reduce((sum, g) => sum + g.stories.length, 0);

  return (
    <>
      {totalStories > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories…"
              className="pl-9"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <BookOpen size={36} strokeWidth={1} />
          <p className="text-sm">{q ? "No stories match your search." : "No stories published yet."}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((group, i) => {
            const label = group.projectName ?? (hasProjects ? "Uncategorised" : null);
            return (
              <div
                key={group.projectId ?? "__ungrouped"}
                className={i > 0 ? "mt-12" : ""}
              >
                {label && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    {label}
                  </h2>
                )}
                <div className="flex flex-col gap-3">
                  {group.stories.map((story) => (
                    <Link
                      key={story.id}
                      href={`${basePath}/stories/${story.slug}`}
                      className="group block p-5 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
                    >
                      <h3 className="text-base font-semibold group-hover:underline underline-offset-4">{story.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(story.updatedAt)}
                        {story.wordCount > 0 && (
                          <> · {story.wordCount.toLocaleString()} words</>
                        )}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
