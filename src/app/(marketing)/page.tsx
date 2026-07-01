import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { APP_NAME, APP_DOMAIN } from "@/config/app";

export const metadata: Metadata = {
  title: "Worldbuilding Tool for Fiction Authors & Game Masters",
  description:
    "Organise your lore, connect your entities, and write with your world open beside you. Custom entity types, linked lore, nested maps, and a built-in writing workspace, free to start.",
  alternates: {
    canonical: "/",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP_NAME,
  url: `https://${APP_DOMAIN}`,
  applicationCategory: "WritingApplication",
  operatingSystem: "Web",
  description:
    "A worldbuilding tool for fiction authors, game masters, and anyone building a world for the love of it. Organise your lore, connect your entities, and write with your world open beside you.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  // D-04: authenticated users are redirected to /dashboard by proxy.ts,
  // so this route is static and doesn't need a per-request session check.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    <div className="flex flex-col">
      {/* ── Section 1: Hero — ART ──────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center text-center px-4 sm:px-6 w-full overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/sylvain-sarrailh-fjord.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top scale-110 origin-top"
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-background/15" />
        <div className="absolute inset-x-0 bottom-0 h-96 pointer-events-none bg-linear-to-t from-muted via-muted/80 to-transparent" />

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

      {/* ── Section 2: Features — PLAIN ────────────────────────────────── */}
      <section id="features" className="py-20 bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
            Simple tools for complex worlds.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <DynamicIcon name="gi:spell-book" size={24} className="text-foreground" />,
                title: "Custom entity types",
                description:
                  "Characters, locations, factions, artefacts, or anything your world needs. Define as many types as you like, each with its own icon and tags. Build your world's vocabulary from scratch.",
              },
              {
                icon: <DynamicIcon name="gi:linked-rings" size={24} className="text-foreground" />,
                title: "Linked lore",
                description:
                  "Connect entities with typed relationships and explore the web of connections as an interactive graph. Wikilink any entity from anywhere; every link survives a rename.",
              },
              {
                icon: <DynamicIcon name="gi:treasure-map" size={24} className="text-foreground" />,
                title: "Nested maps",
                description:
                  "Upload a map and pin entities directly to it. Drill into sub-maps for regions, dungeons, or floor plans, all navigable from a single tree.",
              },
              {
                icon: <DynamicIcon name="gi:quill" size={24} className="text-foreground" />,
                title: "Writing workspace",
                description:
                  "A focused editor built into your world. Organise documents into projects, insert wikilinks inline, set word goals, and switch to focus mode when it's time to write.",
              },
              {
                icon: <DynamicIcon name="gi:key" size={24} className="text-foreground" />,
                title: "Granular sharing",
                description:
                  "Toggle visibility per entity, map, or document. Share a public link with your players or readers and reveal lore as your story unfolds, one entry at a time.",
              },
              {
                icon: <DynamicIcon name="gi:scroll-unfurled" size={24} className="text-foreground" />,
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

      {/* ── Section 3: Data Ownership — ART ────────────────────────────── */}
      <section id="data-ownership" className="relative py-20 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/sylvain-sarrailh-ghostsofthemeadow.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none bg-linear-to-b from-muted to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none bg-linear-to-t from-muted to-transparent" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
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

      {/* ── Section 4: Personas — PLAIN ────────────────────────────────── */}
      <section id="personas" className="py-20 bg-muted w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
            For everyone who takes their worlds seriously.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
            <div id="for-fiction-authors" className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2e2df]">
                  <DynamicIcon name="gi:quill" size={14} className="text-[#7a3733]" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide bg-[#f2e2df] text-[#7a3733] px-2 py-1 rounded">
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

            <div id="for-ttrpg-gms" className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2e8da]">
                  <DynamicIcon name="gi:crossed-swords" size={14} className="text-[#4b5c3a]" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide bg-[#e2e8da] text-[#4b5c3a] px-2 py-1 rounded">
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

            <div id="for-game-designers" className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dfe6ea]">
                  <DynamicIcon name="gi:battle-mech" size={14} className="text-[#3d5866]" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide bg-[#dfe6ea] text-[#3d5866] px-2 py-1 rounded">
                  Game Designers
                </span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mt-3">
                Keep your world&apos;s canon straight as scope grows.
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Track characters, locations, and factions in one place instead
                of scattered design docs. Keep everything consistent as your
                project scales, then export the whole bible as Markdown
                whenever your pipeline needs it.
              </p>
              <p className="mt-4 text-sm font-medium text-foreground flex items-center gap-1">
                <ChevronRight size={14} aria-hidden="true" /> One source of truth, always exportable.
              </p>
            </div>

            <div id="for-worldbuilders" className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1e6d3]">
                  <DynamicIcon name="gi:world" size={14} className="text-[#8a6a2e]" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide bg-[#f1e6d3] text-[#8a6a2e] px-2 py-1 rounded">
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

      {/* ── Section: CTA — ART ────────────────────────────────────────── */}
      <section className="relative py-24 text-center px-4 sm:px-6 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/sylvain-sarrailh-sailorsunset.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none bg-linear-to-b from-muted to-transparent" />

        <div className="relative z-10 max-w-xl mx-auto">
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
    </>
  );
}
