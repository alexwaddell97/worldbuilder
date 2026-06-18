# Stack Research: Worldbuilder

**Project:** Worldbuilding SaaS platform
**Researched:** 2026-06-18
**Overall confidence:** HIGH

---

## Recommended Stack

### Decided (from project brief)

These are locked in. Research validates them.

| Technology | Version | Validation |
|------------|---------|------------|
| Next.js (App Router) | 15.x | HIGH confidence. Server Components + Server Actions map cleanly to the three-tier access model (Builder/Player/Explorer). RSC reduces client bundle for readers. |
| Tailwind CSS | 4.x | HIGH confidence. Pairs naturally with shadcn/ui. No issues. |
| shadcn/ui | Latest (component registry) | HIGH confidence. Not a versioned dependency — copy-paste components. Ideal for the "Apple-clean" aesthetic as it's unstyled by default. |
| Tiptap | 3.x | HIGH confidence — Tiptap 3.0 shipped in 2025 with bidirectional Markdown support built-in (parse Markdown to JSON, serialize back). Custom tokenizers allow wikilink `[[EntityName]]` syntax. Yjs-ready for future collaboration. |

**Tiptap wikilinks note:** Bidirectional markdown serialization is built-in as of Tiptap 3.0. For `[[wikilinks]]`, use a custom tokenizer via the `markdownTokenizer` API. A community extension `tiptap-wikilink-extension` (GitHub: aarkue/tiptap-wikilink-extension) exists as a reference implementation. Build this as a first-party custom extension to ensure export fidelity to Obsidian format.

---

### Database & ORM

**Recommendation: Neon (PostgreSQL) + Drizzle ORM**

**Database: Neon Serverless PostgreSQL**

Neon is the right call for this project.

- True serverless PostgreSQL with scale-to-zero — no idle cost between sessions for a solo-builder tool
- Instant copy-on-write database branching (sub-second regardless of DB size) — critical for safe schema migration testing against production data
- Native PostgreSQL, not a compatibility layer — all extensions work (full-text search, JSONB, future pgvector)
- Cold start is 500ms–2s when compute is suspended; acceptable for a world that gets occasional explorer visits
- Vercel marketplace integration available; avoids Supabase's platform lock-in (auth, storage, realtime) when you're building those layers yourself
- Avoids PlanetScale which was historically MySQL and their Postgres product (Neki) is not native Postgres

Supabase is a legitimate alternative but brings an opinionated platform layer (its own auth, storage, realtime) that conflicts with the stack choices already made. Using Supabase as a pure database is wasteful.

**ORM: Drizzle ORM**

- Version: `drizzle-orm` 0.44.x / `drizzle-kit` 0.31.x (stable; v1.0.0-beta is available but not production-recommended yet)
- Type-safe schema-as-code: schema defined in TypeScript, no separate `.prisma` file, no codegen step
- SQL-transparent: queries read as SQL — critical when modeling a complex entity graph with typed edges, because you need precise JOIN control
- No binary/WASM engine: cold start is ~45ms vs Prisma 7's ~320ms on Vercel Functions
- `drizzle-kit generate` + `drizzle-kit migrate` for migration management, stores migration history in `__drizzle_migrations`
- Relational query API (`db.query.entities.findMany({ with: { relations: true } })`) handles the world entity graph without raw SQL

**Why not Prisma:** Prisma 7 removed the Rust engine and is now edge-compatible, which closes the cold-start gap somewhat (~320ms vs ~45ms). Prisma still requires `prisma generate` on every schema change — a friction point. For a team comfortable with SQL (which a solo builder project assumes), Drizzle's SQL-mirror API is more predictable. Prisma is better for teams new to databases; that's not this project.

**Data model guidance:** Use a single shared-schema multi-tenant approach with `world_id` on every entity row. PostgreSQL Row-Level Security (RLS) can be added later for the Player spoiler/reveal system. JSONB for custom entity type fields (world-specific schemas differ per world). The entity relationship graph maps to a standard junction table: `entity_relations(id, world_id, source_entity_id, target_entity_id, relation_type, metadata JSONB)`.

```typescript
// Installation
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

---

### Authentication

**Recommendation: Better Auth 1.6.x**

Better Auth is the correct choice here. Reasons:

- **Self-hosted, no vendor lock-in** — auth data lives in your own Postgres database alongside world data. No external vendor holds user records. This aligns with the "data ownership" core value.
- **Plugin architecture** — ships with first-party plugins for organizations (multi-tenant), passkeys, magic links, 2FA, RBAC. The `organization` plugin maps naturally to the world membership model (a world is effectively a tenant, Builders and Players are org members).
- **shadcn/ui UI library** (`better-auth-ui`) — prebuilt auth screens styled to shadcn/ui. Zero custom auth UI work in early phases.
- **Drizzle adapter** — built-in adapter pushes auth schema into the same Postgres database, using Drizzle. Auth tables and world tables colocate.
- **Next.js-first** — `nextCookies()` plugin handles cookie setting automatically. Server Action + RSC integration documented and first-class.
- Version 1.6.19 is current (verified via npm).

**Configuration profile for this project:**
- Enable: email/password, Google OAuth, GitHub OAuth
- Use the `organization` plugin for world membership (Builder/Player roles within a world)
- `requireEmailVerification: true` — important for a SaaS with public-facing profiles
- Passkeys can be added as a Phase 2 enhancement with zero structural change

**Why not Clerk:** Clerk is excellent for rapid prototyping but costs scale with MAU after 10K free users. More importantly, user records live in Clerk's cloud — incompatible with the "data ownership" principle. The common pattern is Clerk for v1 then migrate at 50K MAU; skip the migration by starting with Better Auth.

**Why not Auth.js (NextAuth v5):** Limited feature set — no built-in 2FA, RBAC, or passkeys. Plugin system is sparse vs Better Auth. Better Auth is a superset in terms of features.

```typescript
// Installation
npm install better-auth
```

---

### Graph Visualization

**Recommendation: @xyflow/react 12.x (React Flow)**

React Flow (now published as `@xyflow/react`) is the dominant React library for interactive node-edge graphs. Version 12.9.x is current (June 2026).

- **React-native:** Nodes are HTML DOM elements, not Canvas — means custom node content is just React components. Entity cards, icons, relationship labels are trivial to build.
- **Built-in behaviors:** Drag, zoom, pan, minimap, connection handles all included. No reimplementing standard graph UX.
- **Typed edges:** Supports labeled, colored, and animated edges out of the box — maps directly to "typed relationships" (e.g., "Knows," "Commands," "Opposes").
- **Server-side hydration in v12:** SSR-compatible, important for the Explorer read-only view in Next.js.
- **Custom node types:** World entity nodes will be custom React components; React Flow's `nodeTypes` registry handles this cleanly.
- **Layout:** React Flow provides manual positioning; combine with the `@xyflow/react` `layouting` utilities or `dagre` for auto-layout on initial render. Dagre is the standard choice for directed graphs.

**For auto-layout on first render:** Use `dagre` (npm: `dagre`) for automatic node positioning when a world has many entities. React Flow's docs include a working dagre integration example. This handles the "I just added 40 characters" case without the user manually arranging all nodes.

**Why not D3.js:** D3 is low-level — you'd be building the entire interaction layer from scratch (drag, zoom, connection handles, edge routing). It's the right choice when you need a highly custom force-directed visualization (e.g., Obsidian's graph). For this project's relationship graph, React Flow's pre-built interaction patterns match the requirements exactly.

**Why not Cytoscape.js:** Canvas-based rendering. Nodes cannot contain rich React content (entity icons, inline stats). Harder to style to match the "Apple-clean" aesthetic.

```typescript
// Installation
npm install @xyflow/react dagre
npm install -D @types/dagre
```

---

### File Storage (for world asset export)

**Recommendation: Vercel Blob (v1), plan to migrate to Cloudflare R2 at scale**

**Phase 1 (launch): Vercel Blob**

- Zero configuration in the Vercel ecosystem — one npm package, one API
- Built-in CDN delivery for images attached to world entities (character portraits, location maps)
- 15-minute billing sampling model is economically favorable for early-stage usage with transient uploads
- Export archive (.zip of markdown + assets) is generated on-demand and served from Blob temporarily — cost near zero at low volume

**Scale threshold (~10K+ active worlds with heavy media):** Migrate to Cloudflare R2.
- R2 is S3-compatible with zero egress fees — critical once you're serving large export archives or many world images to Explorer visitors
- R2 pricing: $0.015/GB-month storage, $0/GB egress vs Vercel Blob $0.023/GB-month + $0.05/GB egress
- Migration is mechanical: change the SDK, update environment variables

**What to store:**
- User-uploaded world images (character portraits, location maps, world cover art)
- On-demand export ZIP archives (generated, stored briefly, downloaded, then deleted)
- Do NOT store markdown content in blob storage — that belongs in PostgreSQL as text

```typescript
// Installation (Phase 1)
npm install @vercel/blob
```

---

### Email

**Recommendation: Resend + React Email**

- Resend was built by the same team as React Email — the integration is seamless
- Write email templates as React JSX components (same component model as the app)
- 100 emails/day free tier; 250K/month on paid — ample for launch
- Server Action + Route Handler integration is first-class
- Better Auth's `sendVerificationEmail` and `sendResetPassword` hooks accept a Resend call directly
- Transactional emails needed: email verification, password reset, world update newsletters (Builder-to-Explorer notification)

The newsletter/update notification use case (Builder publishes a world update, Explorers who follow get emailed) fits cleanly in Resend's transactional model. It is not a marketing email platform (no list segmentation, A/B testing) — that's appropriate since this is product-triggered notifications, not ad campaigns.

```typescript
// Installation
npm install resend @react-email/components
```

---

### Other Infrastructure

**Background Jobs: None in v1**

Export ZIP generation is the only potentially slow operation. For v1, run it synchronously in a Route Handler with a reasonable timeout (Vercel Functions have a 60s limit on Hobby, 900s on Pro). If export times become a problem at scale, add a job queue (Trigger.dev or Inngest) in a later phase.

**Search: PostgreSQL full-text search**

PostgreSQL's built-in `tsvector` / `tsquery` for entity search within a world. Postgres full-text handles "find all characters named Aran" across thousands of entities without adding a separate search service. Add Algolia or Typesense only if cross-world public discovery search becomes a serious UX requirement.

**Caching: Next.js built-in + Neon connection pooling**

Use Next.js `unstable_cache` / `'use cache'` directive for public Explorer page caching. Neon provides a built-in connection pooler — configure max connections appropriately for serverless functions (use `@neondatabase/serverless` driver with Neon's HTTP API for edge/serverless).

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **Supabase (as full platform)** | Brings its own auth, storage, realtime — redundant with Better Auth + Drizzle + Vercel Blob. Using Supabase as a pure Postgres host wastes the platform fee. |
| **Clerk** | Per-MAU pricing after 10K free; user records in Clerk's cloud violates data ownership principle. |
| **Auth.js / NextAuth v5** | Too limited: no RBAC, no passkeys, no 2FA, no organizations plugin. Requires more custom code than Better Auth for this access model. |
| **Prisma** | `prisma generate` friction; heavier cold starts than Drizzle; Prisma Schema Language is a second schema language to maintain alongside TypeScript. Better for database novices, not needed here. |
| **D3.js** | Low-level; would require reimplementing drag, pan, zoom, edge routing from scratch. Wrong tool for an interactive editor; right tool for a read-only force-directed visualization (revisit if a separate "Obsidian-style graph" view is added). |
| **Firebase / MongoDB** | Document databases require modeling entity relationships in application code. The world's core data model is inherently relational (entities, typed edges, roles). PostgreSQL is the right primitive. |
| **PlanetScale PostgreSQL** | Not native Postgres (built on Neki). Extension compatibility risk. Higher minimum cost ($50/month Metal). Neon is native and cheaper. |
| **GraphQL (as API layer)** | Adds a separate schema and resolver layer on top of Drizzle. Next.js Server Components + Server Actions allow direct database calls from the same codebase. GraphQL is appropriate for public APIs consumed by external clients — not needed for a self-contained Next.js app in v1. |
| **Redis** | Not needed at v1 scale. PostgreSQL handles session data (Better Auth stores sessions in Postgres by default) and caching needs are met by Next.js's built-in `'use cache'`. Add Redis if rate limiting at scale becomes a problem. |

---

## Open Questions

**1. Multi-tenancy RLS vs application-layer isolation**

The current recommendation is application-layer tenant isolation (`WHERE world_id = ?` on all queries). PostgreSQL Row-Level Security (RLS) is more robust but adds query planner complexity. Decision needed before the Player/spoiler reveal system is built — that's where naive application-layer isolation is most likely to leak data.

Recommendation: prototype with application-layer isolation in Phase 1-2, then evaluate adding RLS policies in the phase where the Player reveal system is implemented.

**2. Entity relationship storage: JSONB metadata vs dedicated edge table**

Custom edge metadata (relationship strength, description, narrative notes) could live in a JSONB column on the `entity_relations` table or in a separate `edge_metadata` table. JSONB is simpler for v1 but harder to query and index at scale. Decision is low-stakes until Phase 2 when the graph editor ships.

**3. Export archive delivery: synchronous vs async**

For worlds with hundreds of entities and attached images, generating a ZIP synchronously in a Vercel Function may hit timeout limits. If the median world has <100 entities, synchronous is fine. If early user research shows large worlds (500+ entities), add background job processing before shipping export.

**4. Neon connection pooling strategy**

Serverless functions create a new database connection per invocation. Use Neon's built-in pgBouncer connection pooler via the `@neondatabase/serverless` driver's HTTP mode for all serverless paths. The `node-postgres` (`pg`) direct connection is only appropriate for long-lived server processes — not Vercel Functions.

Verify: use `@neondatabase/serverless` (Neon's WebSocket/HTTP driver) rather than `pg` for the Drizzle adapter in the Vercel deployment.

---

## Sources

- Drizzle ORM docs: https://orm.drizzle.team/docs/get-started/postgresql-new
- Drizzle vs Prisma comparison: https://makerkit.dev/blog/tutorials/drizzle-vs-prisma
- Better Auth docs: https://better-auth.com/docs/integrations/next
- Better Auth vs Clerk comparison: https://makerkit.dev/blog/tutorials/better-auth-vs-clerk
- React Flow v12 release: https://xyflow.com/blog/react-flow-12-release
- React Flow npm: https://www.npmjs.com/package/@xyflow/react
- Neon vs Supabase: https://getautonoma.com/blog/supabase-vs-neon
- Serverless PostgreSQL comparison: https://www.dataformathub.com/blog/serverless-postgresql-2025-the-truth-about-supabase-neon-and-planetscale-lkq
- Vercel Blob storage patterns: https://www.edge-cases.com/nextjs/vercel-blob-storage-patterns
- Resend Next.js integration: https://resend.com/docs/send-with-nextjs
- Tiptap Markdown docs: https://tiptap.dev/docs/editor/markdown
- Tiptap wikilink extension reference: https://github.com/aarkue/tiptap-wikilink-extension
- React graph visualization guide: https://cambridge-intelligence.com/blog/react-graph-visualization-library/
