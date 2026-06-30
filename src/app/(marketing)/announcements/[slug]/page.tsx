import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { announcements } from "@/content/announcements";

export function generateStaticParams() {
  return announcements.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = announcements.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image ? [{ url: post.image }] : [{ url: "/opengraph-image" }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnnouncementPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = announcements.find((p) => p.slug === slug);
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <div className="flex flex-col">
      {/* Cover */}
      {post.image ? (
        <div className="relative w-full h-72 md:h-96 overflow-hidden">
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/15 backdrop-blur-xs" />
          <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none bg-linear-to-t from-background to-transparent" />
        </div>
      ) : (
        <div
          className="w-full h-56 md:h-72"
          style={{
            backgroundColor: "#eeece7",
            backgroundImage:
              "linear-gradient(rgba(238,236,231,0.6), rgba(238,236,231,0.6)), url('/topography.svg')",
          }}
        />
      )}

      <section className="py-12 max-w-2xl mx-auto px-4 sm:px-6 w-full">
        <div className="mb-8">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} /> All announcements
          </Link>
          <time className="block text-xs text-muted-foreground mt-4">
            {formatDate(post.date)}
          </time>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-8">
          {post.title}
        </h1>

        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((para, i) => {
            const isHeading = para.length < 50 && !para.endsWith(".") && !para.endsWith(",");
            return (
              <p key={i} className={isHeading ? "font-semibold text-foreground text-base mt-8" : ""}>
                {para}
              </p>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Have thoughts?{" "}
            <a
              href="https://discord.gg/d4nYK9nZG8"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Join us on Discord
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
