import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Link2,
  Download,
  FileText,
  ChevronRight,
  PenLine,
  Swords,
  Layers,
  Eye,
  Globe,
} from "lucide-react";

export default async function HomePage() {
  // D-04: authenticated users redirect to /dashboard
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col">
      {/* ── Section 1: Hero ────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center text-center px-4 sm:px-6 w-full overflow-hidden"
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landscape.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/15 backdrop-blur-xs" />
        {/* Bottom fade into page */}
        <div
          className="absolute inset-x-0 bottom-0 h-96 pointer-events-none bg-linear-to-t from-muted via-muted/80 to-transparent"
        />

        <div className="relative max-w-3xl mx-auto pt-14">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          Build richer worlds.
          <br />
          Write better stories.
        </h1>
        <p className="text-lg md:text-xl text-foreground/75 mt-6 max-w-xl mx-auto">
          A worldbuilding tool for fiction authors, game masters, and anyone
          building a world for the love of it. Organise your lore, connect
          your entities, and write with your world open beside you.
        </p>
        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Start building, it&apos;s free
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
          <a
            href="#features"
            className="text-foreground/60 hover:text-foreground underline-offset-4 hover:underline px-6 py-3 transition-colors"
          >
            See how it works
          </a>
        </div>
        </div>
      </section>

{/* ── Section 2: Features ────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
            Simple tools for complex worlds.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <BookOpen size={24} aria-hidden="true" />,
                title: "Custom entity types",
                description:
                  "Characters, locations, factions, artefacts, or anything your world needs. Define as many types as you like, each with its own icon and tags. Build your world's vocabulary from scratch.",
              },
              {
                icon: <Link2 size={24} aria-hidden="true" />,
                title: "Linked lore",
                description:
                  "Connect entities with typed relationships and explore the web of connections as an interactive graph. Wikilink any entity from anywhere; every link survives a rename.",
              },
              {
                icon: <Layers size={24} aria-hidden="true" />,
                title: "Nested maps",
                description:
                  "Upload a map and pin entities directly to it. Drill into sub-maps for regions, dungeons, or floor plans, all navigable from a single tree.",
              },
              {
                icon: <FileText size={24} aria-hidden="true" />,
                title: "Writing workspace",
                description:
                  "A focused editor built into your world. Organise documents into projects, insert wikilinks inline, set word goals, and switch to focus mode when it's time to write.",
              },
              {
                icon: <Eye size={24} aria-hidden="true" />,
                title: "Granular sharing",
                description:
                  "Toggle visibility per entity, map, or document. Share a public link with your players or readers and reveal lore as your story unfolds, one entry at a time.",
              },
              {
                icon: <Download size={24} aria-hidden="true" />,
                title: "Markdown export",
                description:
                  "Export your entire world as Markdown with wikilinks at any time, for free. Opens cleanly in Obsidian, Logseq, or any editor that supports [[wikilinks]].",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="text-foreground">{feature.icon}</div>
                <h3 className="font-semibold text-foreground mt-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Data Ownership ──────────────────────────────────── */}
      <section id="data-ownership" className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-8">
            Your world, your data
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Your lore is stored in your account and never held hostage. If you
              ever want to leave, export your entire world as Markdown with
              one click. Every entity, every relationship, every tag.
            </p>
            <p>
              Exported files use YAML frontmatter and{" "}
              <code className="font-mono text-sm bg-muted px-1 rounded">
                [[wikilinks]]
              </code>
              . Open the export folder in Obsidian, Logseq, or any editor that
              supports wikilinks. Everything resolves cleanly, no post-processing.
            </p>
            <p>
              We do not run ads, do not sell your data, and do not use your
              content to train AI models. Building a worldbuilding platform you
              can trust for years is the entire point.
            </p>
          </div>
          <blockquote className="mt-8 border-l-4 border-primary pl-6 italic text-foreground">
            Export is a first-class feature: always available, always free, and always complete.
          </blockquote>
        </div>
      </section>

      {/* ── Section 5: Personas ────────────────────────────────────────── */}
      <section id="personas" className="py-20 bg-muted w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
          For everyone who takes their worlds seriously.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Fiction Authors */}
          <div
            id="for-fiction-authors"
            className="bg-card border border-border rounded-lg p-8"
          >
            <div className="flex items-center gap-2">
              <PenLine size={16} className="text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-1 rounded">
                Fiction Authors
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-3">
              Build the mythology, then write the story.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Build your lore bible, then open the writing workspace and draft with your world a wikilink away. Set session goals, track word counts, and switch to focus mode when it&apos;s time to write.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground flex items-center gap-1">
              <ChevronRight size={14} aria-hidden="true" /> Private by default. Share publicly when you&apos;re ready.
            </p>
          </div>

          {/* TTRPG GMs */}
          <div
            id="for-ttrpg-gms"
            className="bg-card border border-border rounded-lg p-8"
          >
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-1 rounded">
                TTRPG Game Masters
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-3">
              Run richer campaigns and reveal lore on your terms.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Track your NPCs, locations, and factions. Control exactly what your
              players can see. Reveal spoilers as your campaign unfolds, one
              entity, one secret at a time.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground flex items-center gap-1">
              <ChevronRight size={14} aria-hidden="true" /> Built-in reveal system. Players see only what you unlock.
            </p>
          </div>

          {/* Hobby Worldbuilders */}
          <div
            id="for-worldbuilders"
            className="bg-card border border-border rounded-lg p-8"
          >
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-1 rounded">
                Worldbuilders
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-3">
              Build for the love of it.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Some worlds exist for their own sake. Tolkien spent decades
              building Middle-earth before a publisher ever asked for it.
              If you&apos;re driven by the craft itself, Subcreation gives you
              the tools to go as deep as you want: languages, histories,
              cosmologies, maps.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground flex items-center gap-1">
              <ChevronRight size={14} aria-hidden="true" /> No end goal required.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* ── Section: CTA ──────────────────────────────────────────────── */}
      <section
        className="py-24 text-center px-4 sm:px-6 w-full"
        style={{ backgroundColor: "hsl(var(--background))", backgroundImage: "linear-gradient(hsl(var(--background) / 0.6), hsl(var(--background) / 0.6)), url('/topography.svg')" }}
      >
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Ready to build your world?
          </h2>
          <p className="text-muted-foreground mt-4">
            Start free. No payment required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Start building, it&apos;s free
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

    </div>
  );
}

