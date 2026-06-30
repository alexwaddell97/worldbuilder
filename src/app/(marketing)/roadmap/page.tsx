import { roadmap, RoadmapStatus, RoadmapCategory } from "@/content/roadmap";

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  "in-progress": "In progress",
  planned: "Planned",
  considering: "Considering",
};

const STATUS_CLASS: Record<RoadmapStatus, string> = {
  "in-progress": "bg-foreground text-background",
  planned: "bg-muted text-muted-foreground",
  considering: "bg-muted text-muted-foreground border border-border",
};

const CATEGORIES: RoadmapCategory[] = ["Core", "Integration", "Platform"];

export default function RoadmapPage() {
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
            Roadmap
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            What&apos;s coming
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            A live view of what&apos;s being built, planned, and considered.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 w-full">
        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const items = roadmap.filter((r) => r.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  {category}
                </h2>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.title}
                      className="rounded-lg border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 self-start text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_CLASS[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-16">
          Have a suggestion?{" "}
          <a
            href="https://discord.gg/d4nYK9nZG8"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Share it on Discord
          </a>
        </p>
      </section>
    </div>
  );
}
