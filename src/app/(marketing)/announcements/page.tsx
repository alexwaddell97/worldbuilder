import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { announcements } from "@/content/announcements";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AnnouncementsPage() {
  const sorted = [...announcements].reverse();

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
            Announcements
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            From the developer
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Updates, decisions, and news about Subcreation.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-2xl mx-auto px-4 sm:px-6 w-full">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">
            Nothing here yet.
          </p>
        ) : (
          <ol className="space-y-10">
            {sorted.map((post) => (
              <li key={post.slug}>
                <Link href={`/announcements/${post.slug}`} className="group block">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt=""
                      className="w-full h-52 object-cover rounded-lg mb-5"
                    />
                  ) : (
                    <div
                      className="w-full h-52 rounded-lg mb-5"
                      style={{
                        backgroundColor: "#eeece7",
                        backgroundImage:
                          "linear-gradient(rgba(238,236,231,0.4), rgba(238,236,231,0.4)), url('/topography.svg')",
                      }}
                    />
                  )}
                  <time className="text-xs text-muted-foreground">
                    {formatDate(post.date)}
                  </time>
                  <h2 className="text-xl font-semibold text-foreground mt-1 mb-2 group-hover:underline underline-offset-4">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-foreground">
                    Read more <ChevronRight size={14} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
