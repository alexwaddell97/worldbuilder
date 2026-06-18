# Phase 1: Project Foundation - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a runnable Next.js application with authentication, the global layout shell, design system tokens, database schema foundation, and Vercel deployment. No user-facing worldbuilding features yet — just the infrastructure every subsequent phase builds on.

What the user sees at the end of Phase 1: a live URL, a working auth flow (sign up → email verify → sign in → dashboard shell), a polished marketing landing page, and a logged-in experience with the sidebar navigation visible but world-management screens empty.

</domain>

<decisions>
## Implementation Decisions

### Navigation Layout
- **D-01:** Collapsible left sidebar (icon rail when collapsed). Follows Notion/Linear/Figma conventions.
- **D-02:** Contextual sidebar — the nav items change based on context: when on the dashboard (world list), show world-switching controls; when inside a specific world, show entity types and world sections.
- **D-03:** Sidebar collapses to icon-only rail (not hidden). User can toggle open/closed.

### Auth Entry & Landing Page
- **D-04:** Root URL (`/`) serves a full marketing landing page for unauthenticated visitors. Authenticated users are redirected to `/dashboard`.
- **D-05:** Landing page sections (in order): Hero, Features, How It Works, Data Ownership & Export, Persona sections (Fiction Authors + TTRPG GMs), Footer.
- **D-06:** Messaging focuses on: data ownership, Obsidian-compatible export, ease of use, no lock-in. No open-source framing in v1.
- **D-07:** Two persona sections address Fiction Authors and TTRPG GMs as distinct audiences.

### Database Schema
- **D-08:** Incremental schema approach — each phase owns its schema slice. Phase 1 only creates tables actually used in Phase 1.
- **D-09:** Phase 1 tables: `users` (managed by Better Auth's schema push), `worlds`, `entity_types`.
- **D-10:** Migration strategy: `drizzle-kit migrate` with tracked migration files (stored in `__drizzle_migrations`). No schema push in production.

### Deployment
- **D-11:** Deploy to Vercel from Phase 1. Production environment linked to `main` branch.
- **D-12:** Production only — no staging branch, no PR preview deployments in Phase 1.
- **D-13:** Use the Vercel-provided URL for now (e.g. `worldbuilder.vercel.app`). Custom domain in a later phase.

### Design System & Visual Tokens
- **D-14:** Custom neutral color palette using shadcn/ui's CSS variable system (`--background`, `--foreground`, `--primary`, `--muted`, etc.). Apple-clean aesthetic: high whitespace, neutral grays, minimal chrome.
- **D-15:** No hardcoded color values anywhere — all colors via CSS variables. This ensures dark mode can be added as an additive later phase with zero retrofitting.
- **D-16:** Primary typeface: **Geist Sans** (via `next/font/google` — zero layout shift). Geist Mono for code blocks only.
- **D-17:** Dark mode deferred to a later phase. Phase 1 ships light mode only but the CSS variable architecture makes dark mode additive.

### Claude's Discretion
- Exact neutral color values (specific hex/HSL for `--background`, `--foreground`, `--muted`, etc.) — choose values that feel Apple-clean (near-white backgrounds, dark-gray text, minimal saturation in accent).
- Sidebar width when open (standard is 240–260px).
- Specific shadcn/ui components to install in Phase 1 vs defer to when they're needed.
- `.env.local` variable naming conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Core requirements, constraints, tech stack decisions, key decisions log
- `.planning/ROADMAP.md` — Full phase breakdown; Phase 1 scope and UAT criteria live here

### Research
- `.planning/research/STACK.md` — Validated stack choices with reasoning: Next.js 15, Tailwind 4, shadcn/ui, Neon, Drizzle ORM, Better Auth 1.6.x — read before making any stack decisions
- `.planning/research/ARCHITECTURE.md` — System component breakdown and data model rationale
- `.planning/research/PITFALLS.md` — Critical pitfalls to avoid, especially: wikilink storage strategy, export-as-afterthought, permission complexity creep, rich/markdown round-trip content loss

No external ADRs or specs beyond the above research docs. Requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project.

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow.

### Integration Points
- Better Auth integrates with Drizzle via the `drizzle` adapter — auth tables (`user`, `session`, `account`, `verification`) are created by Better Auth's `migrate()` call, not manually in Drizzle schema files. Do not duplicate auth table definitions.
- Neon serverless driver (`@neondatabase/serverless`) must be used over the standard `pg` driver for Vercel edge compatibility. Drizzle's Neon adapter: `drizzle(neon(process.env.DATABASE_URL))`.

</code_context>

<specifics>
## Specific Ideas

- **Apple-clean aesthetic:** High whitespace, typography-first, minimal visual chrome. Avoid heavy borders, shadows, or colorful UI elements. Closest reference: Apple's own web products, Linear, Craft.
- **Sidebar feel:** Should feel like a natural part of the app, not a navigation bolted on. Think Notion's sidebar — unobtrusive when collapsed, informative when open.
- **Landing page copy tone:** Calm and confident, not hype-driven. Emphasize trust (your data, portable, no lock-in) over features. Writer-first voice.

</specifics>

<deferred>
## Deferred Ideas

- **Self-hosted / Electron app** — User raised possibility of a future self-hosted Electron version that stores all files locally. Not Phase 1 scope. Note for future milestone planning.
- **Dark mode** — Deliberately deferred. CSS variable architecture in Phase 1 makes this a clean additive feature in a later phase.
- **Custom domain** — Deferred past Phase 1. Use Vercel URL for now.
- **PR preview deployments / staging environment** — Deferred. Production-only deployment for Phase 1 to keep setup lean.
- **Open-source framing** — Not a current requirement. Do not include open-source messaging on the landing page.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Project Foundation*
*Context gathered: 2026-06-18*
