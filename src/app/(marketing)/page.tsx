import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE, APP_COPYRIGHT_YEAR } from "@/config/app";
import {
  BookOpen,
  Link2,
  Download,
  FileText,
  ArrowRight,
  PenLine,
  Swords,
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
        className="py-24 md:py-32 text-center max-w-3xl mx-auto px-6 w-full"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          Build richer worlds.
          <br />
          Own your lore.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-xl mx-auto">
          A beautiful, portable worldbuilding tool for fiction authors and TTRPG
          game masters. Your data, your database, your rules — with one-click
          Obsidian export at any time.
        </p>
        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Start building — it&apos;s free
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline px-6 py-3 transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── Section 2: Features ────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                icon: <BookOpen size={24} />,
                title: "Custom entity types",
                description:
                  "Characters, locations, factions, events, and any type you define. Your world's vocabulary, your way.",
              },
              {
                icon: <Link2 size={24} />,
                title: "Linked lore",
                description:
                  "Entities connect via typed relationships. Rename safely — every link stays intact via UUID. No broken references, ever.",
              },
              {
                icon: <Download size={24} />,
                title: "Obsidian export",
                description:
                  "Export your entire world as Obsidian-compatible markdown at any time, for free. Your lore never disappears.",
              },
              {
                icon: <FileText size={24} />,
                title: "Markdown-first editor",
                description:
                  "Write in a beautiful rich editor or raw markdown. Toggle freely without losing a single word.",
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

      {/* ── Section 3: How It Works ────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 max-w-4xl mx-auto px-6 w-full"
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
          From idea to world in minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            {
              num: "01",
              title: "Create a world",
              body: "Name your world, write a description, set it to private. Invite collaborators, or keep it yours alone.",
            },
            {
              num: "02",
              title: "Define your entities",
              body: "Add characters, locations, factions, or custom types. Write rich content for each. Connect them with typed relationships.",
            },
            {
              num: "03",
              title: "Write freely",
              body: "Use the rich editor or raw markdown. Auto-saves every two seconds. Export to Obsidian with one click, anytime.",
            },
          ].map((step) => (
            <div key={step.num}>
              <div className="text-4xl font-bold text-muted-foreground/30">
                {step.num}
              </div>
              <h3 className="font-semibold text-foreground mt-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Data Ownership ──────────────────────────────────── */}
      <section id="data-ownership" className="py-20 bg-muted/50">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-8">
            Your world. Your data. Always.
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Your lore is stored in your account and never held hostage. If you
              ever want to leave, export your entire world as Obsidian-compatible
              markdown with one click — every entity, every relationship, every
              tag.
            </p>
            <p>
              Exported files use YAML frontmatter and{" "}
              <code className="font-mono text-sm bg-muted px-1 rounded">
                [[wikilinks]]
              </code>
              , the same format Obsidian expects. Open the export folder in
              Obsidian and everything resolves cleanly — no broken links, no
              post-processing.
            </p>
            <p>
              We do not run ads, do not sell your data, and do not use your
              content to train AI models. Building a worldbuilding platform you
              can trust for years is the entire point.
            </p>
          </div>
          <blockquote className="mt-8 border-l-4 border-primary pl-6 italic text-foreground">
            Export is a first-class feature — always available, always free,
            always complete.
          </blockquote>
        </div>
      </section>

      {/* ── Section 5: Personas ────────────────────────────────────────── */}
      <section id="personas" className="py-20 max-w-5xl mx-auto px-6 w-full">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground">
          Built for builders who take their worlds seriously.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Fiction Authors */}
          <div
            id="for-fiction-authors"
            className="bg-card border border-border rounded-lg p-8"
          >
            <div className="flex items-center gap-2">
              <PenLine size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-1 rounded">
                Fiction Authors
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-3">
              Build the full mythology of your novel universe.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Characters with complex pasts. Locations with their own history.
              Factions with competing agendas. Keep it all connected — and export
              it cleanly when you&apos;re done writing.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              → Private by default. Share publicly when you&apos;re ready.
            </p>
          </div>

          {/* TTRPG GMs */}
          <div
            id="for-ttrpg-gms"
            className="bg-card border border-border rounded-lg p-8"
          >
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-1 rounded">
                TTRPG Game Masters
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-3">
              Run richer campaigns. Reveal lore on your terms.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Track your NPCs, locations, and factions. Control exactly what your
              players can see. Reveal spoilers as your campaign unfolds — one
              entity, one secret at a time.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              → Built-in reveal system. Players see only what you unlock.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Footer ──────────────────────────────────────────── */}
      <footer id="footer" className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your world. Your data. Always.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <span>© {APP_COPYRIGHT_YEAR} {APP_NAME}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

