import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ReleaseSection {
  title: string;
  items: string[];
}

function parseReleaseBody(body: string): ReleaseSection[] {
  const sections: ReleaseSection[] = [];
  let current: ReleaseSection | null = null;

  for (const line of body.split("\n")) {
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), items: [] };
      continue;
    }
    const bullet = line.match(/^\*\s+(.+)/);
    if (bullet && current) {
      let text = bullet[1];
      // Strip trailing commit link: ([abcdef](url))
      text = text.replace(/\s*\(\[[\da-f]+\]\(https?:\/\/[^)]+\)\)\s*$/, "");
      // Strip bold internal task/scope prefix: **01-01:** or **scope:**
      text = text.replace(/^\*\*[^*]+\*\*:\s*/, "");
      text = text.trim();
      if (text) current.items.push(text);
    }
  }
  if (current) sections.push(current);

  // Drop version-number headings and empty sections
  return sections.filter(
    (s) => s.items.length > 0 && !/^\d+\.\d+/.test(s.title)
  );
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

async function getReleases(): Promise<GitHubRelease[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/alexwaddell97/worldbuilder/releases",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ChangelogPage() {
  const releases = await getReleases();

  return (
    <div className="flex flex-col">
      <section
        className="py-24 text-center px-4 sm:px-6 w-full"
        style={{
          backgroundColor: "#eeece7",
          backgroundImage:
            "linear-gradient(rgba(238,236,231,0.6), rgba(238,236,231,0.6)), url('/topography.svg')",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Changelog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            What&apos;s new
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Every release, documented.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-2xl mx-auto px-4 sm:px-6 w-full">
        {releases.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">
            No releases yet — check back soon.
          </p>
        ) : (
          <ol className="relative border-l border-border space-y-12 ml-3">
            {releases.map((release) => (
              <li key={release.id} className="pl-8 relative">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-foreground border-2 border-background" />
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {release.tag_name}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(release.published_at)}
                  </time>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {release.name || release.tag_name}
                </h2>
                {release.body && (() => {
                  const sections = parseReleaseBody(release.body);
                  if (sections.length === 0) return null;
                  return (
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <div key={section.title}>
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                            {section.title}
                          </p>
                          <ul className="space-y-1.5">
                            {section.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <Link
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View on GitHub <ExternalLink size={11} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
