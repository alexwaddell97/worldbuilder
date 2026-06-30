import Link from "next/link";
import { ExternalLink } from "lucide-react";

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
                {release.body && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {release.body}
                  </p>
                )}
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
