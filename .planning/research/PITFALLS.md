# Pitfalls Research: Worldbuilder

**Domain:** Worldbuilding platform with wiki-style entity graph, permission/reveal system, and Obsidian-compatible export
**Researched:** 2026-06-18
**Overall confidence:** HIGH (most pitfalls verified against official docs or active community discussions)

---

## Critical Pitfalls (build-breaking if ignored)

### 1. Storing Wikilinks by Name Instead of ID

**What goes wrong:** The Tiptap wikilink extension and the standard Mention extension both pass an `id` and a `name` (or `label`) into the node attributes. If you store only the display name in the document's ProseMirror JSON — e.g., `[[Aria Stonehaven]]` — then every rename requires a full-text scan and rewrite across every document in the world. At moderate world sizes (hundreds of entities with thousands of cross-links) this becomes a cascade update problem with no clean solution.

**Why it happens:** The path of least resistance is to match how Obsidian renders wikilinks — as plain text names. Developers implement the extension to resolve `[[Name]]` at render time, store the name in the doc, and only discover the rename problem after users have built out real content.

**Consequences:** Renaming "Aria Stonehaven" to "Lady Stonehaven" either silently breaks every existing link or requires a bulk rewrite job. The export path doubles the problem: export reads from DB JSON, and if IDs were not preserved, exported Obsidian files will have inconsistent link text after any rename.

**Prevention:** Store a stable UUID in the node attribute (`data-entity-id`) alongside the display label. At render time, resolve the display name from the entity store, not from the stored string. On export, emit `[[Current Entity Name]]` by looking up the live name from the entity record — this way the export is always consistent with current entity names regardless of intermediate renames.

**Warning signs:** Any implementation that stores `[[EntityName]]` as the canonical reference rather than `[[EntityName|UUID]]` or an id attribute is at risk.

**Phase:** Must be addressed in the first editor phase before any content is written.

---

### 2. Obsidian Export as an Afterthought

**What goes wrong:** The export system gets built at the end as a "dump to markdown" feature rather than being a maintained data contract. Internal data structures accumulate fields that have no markdown representation — embedded images stored as blob references, relationship data stored only in a join table, entity metadata stored in DB columns with no frontmatter counterpart — and the export silently drops them.

**Why it happens:** The team optimizes for the in-app experience, stores data in the most convenient DB shape, and defers the export mapping. By the time export is attempted, the gap between DB shape and Obsidian format is large.

**Consequences:** Users export a world and find broken links, missing relationship data, images as dead references, or YAML frontmatter that Obsidian doesn't parse. The "no lock-in" promise is broken. Community trust, once lost over this, is very hard to recover — this is the number-one complaint about WorldAnvil and similar platforms.

**Prevention:** Define the Obsidian file schema (YAML frontmatter fields, wikilink conventions, folder structure) before writing the first entity. Treat it as a specification: every feature that stores data must also update the export mapping. Run export round-trip tests — export a world, import into Obsidian in CI, verify link resolution — from the first entity milestone. Export is not a phase; it is a contract enforced throughout.

**Specific Obsidian constraints to encode now:**
- Wikilinks in YAML frontmatter are not natively resolved by Obsidian's core (community plugins required). Store relationships as a list of display names in frontmatter, not `[[wikilink]]` syntax inside YAML values.
- Filenames cannot contain `/ \ : * ? " < > |` — these must be sanitized when writing files.
- Obsidian resolves links by filename (not folder path) by default — entity names that are not globally unique within a world will cause link ambiguity in Obsidian.

**Warning signs:** If the export code is first written after the editor is complete, it's already late. If any DB field has no corresponding frontmatter or body mapping, data will be lost on export.

**Phase:** Define export schema in Phase 1. Implement export in the same phase as entity creation. Never let a feature ship without its export mapping.

---

### 3. Permission/Reveal System Complexity Creep

**What goes wrong:** The reveal system starts simple — "this entity is hidden/revealed to players" — and gradually accumulates exceptions: reveal individual paragraphs, reveal different content per player, reveal status auto-flips when a session note is added, section-level granularity per entity, nested entity inheritance. Each exception seems small. Together they produce a permission model that is impossible to reason about, impossible to test exhaustively, and produces subtle data leakage.

**Why it happens:** GMs make incremental feature requests that each sound reasonable. The underlying permission model was not designed to accommodate them. WorldAnvil's permission system is notoriously complex for exactly this reason — it ships three separate mechanisms (article privacy, secrets, visibility toggles) with no clear mental model for which to use.

**Consequences:** Builders are confused about what players can see. Players encounter spoilers. The data query layer must check permissions at every join, and performance degrades as policies multiply. Security audit becomes effectively impossible. The biggest risk is not denial-of-access but accidental access — a player seeing a spoiler is unrecoverable.

**Prevention:** Define the permission model as a formal specification before writing any code. Establish the invariant: **a piece of content has exactly one visibility state: hidden or revealed**. Revealed means all players in the world can see it; hidden means no players can see it. Do not add per-player reveal granularity in v1. Do not add section-level granularity in v1. Implement with row-level security in the database, not application-layer filtering — this ensures the policy is enforced at the query level even if the application layer has a bug. The Builder/Player/Explorer distinction maps cleanly to three database roles; maintain that mapping strictly.

**Warning signs:** Any feature request that says "reveal to specific players" or "reveal a section" is a scope expansion of the permission model. Treat it as a separate milestone, not a quick addition.

**Phase:** Permission model formal spec in Phase 1 before editor work. RLS implementation in the same phase as Player access.

---

### 4. Rich/Markdown Mode Toggle Causes Content Loss

**What goes wrong:** The two-mode editor (rich Tiptap view / raw markdown textarea) requires a round-trip conversion on every toggle. ProseMirror's schema is strict: content that does not conform to the schema is silently dropped on parse. Custom nodes (wikilinks, entity callouts, embedded graph snippets) have no standard markdown representation — they will not survive the round-trip through a naive markdown serializer.

**Tiptap documentation states explicitly:** "Content which does not conform to the schema WILL BE LOST. This is a tradeoff, ProseMirror can accept a fair amount of HTML content & parse it into a structured format but it cannot reliably do so with arbitrary HTML."

**Why it happens:** The toggle is implemented first for simple paragraphs and headings, where it works fine. Custom extensions are added later without updating the markdown serializer. A user writes wikilinks in rich mode, switches to markdown mode, edits, and switches back — the wikilinks are now plain text.

**Consequences:** Irreversible data loss for users who switch modes while writing. Wikilinks silently become broken text. Custom nodes disappear.

**Prevention:** Every custom Tiptap extension must implement both `parseMarkdown` and `renderMarkdown` handlers from the start, using Tiptap's `@tiptap/markdown` extension's custom serialization API. Write round-trip tests for every custom node before shipping the toggle. The toggle should be disabled or warn if the document contains custom nodes that have incomplete markdown representations.

**Warning signs:** Custom extensions that only implement `renderHTML` and `parseHTML` but not `renderMarkdown` and `parseMarkdown`.

**Phase:** Custom extension serialization must be complete before the mode toggle is exposed to users.

---

## Significant Pitfalls (painful but recoverable)

### 5. Graph Visualization Performance Collapse at Scale

**What goes wrong:** React Flow renders well up to roughly 100-200 nodes with standard SVG/DOM rendering. Beyond that, edge animations (CSS `stroke-dasharray`), complex node styling (shadows, gradients), and unconstrained layout algorithms cause CPU spikes during pan/zoom. A world with 500+ entities (moderate for an active TTRPG campaign) will feel sluggish.

**Why it happens:** The initial implementation works fine for the small test world used during development. Performance problems only surface at realistic scale. Layout algorithms like ELK.js (7.8 MB bundle, Java-ported) or Dagre run synchronously on the main thread for initial layout.

**Specific risks:**
- Dagre runs layout synchronously — for 300+ nodes this blocks the UI thread for hundreds of milliseconds.
- ELK.js is the most capable layout engine but is 7.8 MB and complex to configure correctly.
- React Flow re-renders on every pan/zoom event unless node/edge components are memoized with `React.memo`.
- Edge animations (CSS stroke-dasharray animated) become a serious GPU bottleneck at 200+ edges.

**Prevention:** Run layout algorithms in a Web Worker, not the main thread. Disable edge animations by default; use static styled edges. Use `React.memo` on all node and edge components. Implement viewport culling — only render nodes in the current viewport. For large worlds, implement a "cluster view" that groups entities by type and only renders the full graph on demand. Never use `useState` or React Context for diagram state — use Zustand with selectors.

**Warning signs:** Graph is built with animated edges or complex CSS on nodes before performance testing with 300+ nodes.

**Phase:** Performance constraints should be baked into the initial graph implementation. Test with 500 nodes before shipping the graph feature.

---

### 6. Entity Deletion Without Reference Cleanup

**What goes wrong:** An entity is deleted. Every document that contained a `[[Entity Name]]` wikilink now resolves to nothing. Every relationship edge in the graph that pointed to this entity is now dangling. The export will contain broken links. The graph will show ghost edges.

**Why it happens:** Hard delete is the simplest implementation. Reference checking requires scanning document content or maintaining a separate backlink index.

**Prevention:** Use soft delete for entities (`deleted_at` timestamp, `is_deleted` boolean). Maintain a `backlinks` table that records every document-to-entity reference (populated on save). Before deletion, show the builder a list of references and require explicit confirmation. On soft delete, mark references as `broken` rather than removing them — broken links render visually distinct but do not silently disappear. Reserve hard delete for an explicit "purge" action separate from normal deletion.

**Warning signs:** No backlink tracking table in the schema. No confirmation step before entity deletion.

**Phase:** Backlink index and soft delete must be in the schema before the editor is shipped to users.

---

### 7. Next.js App Router Caching Causing Stale Permission State

**What goes wrong:** Next.js App Router has four distinct caching layers (Request Memoization, Data Cache, Full Route Cache, Router Cache). A builder reveals an entity to players. The player's view is served stale content — the entity is still hidden — because the Full Route Cache was not invalidated. With permission-sensitive content, stale cache means data leakage in both directions: players see content they shouldn't, or cannot see content that was revealed.

**Why it happens:** `revalidateTag` and `revalidatePath` invalidate the Data Cache and Full Route Cache on the current server instance but not on other instances behind a load balancer. Even single-instance deployments can serve stale Router Cache data to clients for up to 30 seconds.

**Prevention:** All permission-sensitive data fetching must use `no-store` cache option or very short revalidation windows. Use `revalidateTag` tied to world/entity IDs on every mutation Server Action. For the Player view specifically, treat it as fully dynamic — no full-route cache. The Builder's edit session is also dynamic. Reserve static caching for the Explorer (public, anonymous) view only, where staleness is acceptable.

**Warning signs:** Builder reveal action doesn't immediately reflect for players. Using default cache behavior for pages that show permission-filtered content.

**Phase:** Cache strategy decision must be made when building the permission-filtered views.

---

### 8. Full-Text Search Computed at Query Time

**What goes wrong:** Searching across entity content works fine during development with 50 entities. At production scale with thousands of entities containing long markdown documents, `WHERE content ILIKE '%dragon%'` or even `to_tsvector(content)` computed at query time causes full table scans that slow the entire database.

**Prevention:** Use a persisted, GIN-indexed `tsvector` column updated via trigger. Compute it as a GENERATED ALWAYS column combining entity name (high weight), summary (medium weight), and body content (low weight). This converts search from a full table scan to an index lookup — query time scales with matches, not table size. For markdown content specifically, strip markdown syntax from the tsvector source (backticks, brackets, headers) to avoid noise tokens.

**Warning signs:** No `tsvector` column in the entity table schema. Search query uses `ILIKE` or inline `to_tsvector`.

**Phase:** Schema must include the tsvector column from the first migration. Do not retrofit this.

---

### 9. Public Discovery Layer Without Spam/Abuse Guardrails

**What goes wrong:** The public discovery page launches with no rate limiting on world creation, no content moderation, and no reporting mechanism. A single bad actor floods the discovery page with spam worlds. Spam harms legitimate builders whose worlds are buried and damages the platform's perceived quality.

**Why it happens:** Moderation is not a product feature — it feels like an operational concern that can be added later. By the time the platform is public, the discovery page has been indexed and has organic traffic, making cleanup more visible.

**Prevention:** Before public launch: require email verification before any content is made public; implement a minimum-age rule (world must be at least 24 hours old to appear in discovery); add report/flag functionality even if moderation is manual at first; rate-limit world creation and publication per account. Moderation does not require automated ML — manual review of flagged content is sufficient at small scale.

**Warning signs:** Public discovery ships without any report/flag mechanism.

**Phase:** Must be designed before public discovery feature is built, not added post-launch.

---

### 10. Misplaced "use client" Boundaries in App Router

**What goes wrong:** The Tiptap editor, graph visualization (React Flow), and interactive sidebar are all client components. If `"use client"` is placed at a page level or high in the layout tree, the entire page — including the entity sidebar, navigation, and static metadata — is forced into the client bundle and hydrated on every load.

**Prevention:** Push `"use client"` to leaf-level components only. The page component, layout, and sidebar that shows entity metadata should be Server Components. Only the editor canvas and graph canvas are Client Components. Pass entity data as serializable props from Server to Client — avoid passing non-serializable values (functions, class instances) across the RSC boundary, as these bloat the Flight payload.

**Warning signs:** `"use client"` at the top of a page or layout file. Editor or graph component imported directly into a Server Component without being isolated in its own client boundary file.

**Phase:** Architecture decision before the first page is built. Review at each new page addition.

---

## Minor Pitfalls (good to know)

### 11. Obsidian Wikilink Ambiguity from Non-Unique Entity Names

**What goes wrong:** Obsidian resolves `[[Castle Greyhaven]]` by searching the vault for a file named `Castle Greyhaven.md`. If two entities share the same name (different types — a location named "The Keep" and a faction named "The Keep"), Obsidian will link to whichever file it finds first (alphabetical, or the one in the same folder). Both links in documents are now ambiguous.

**Prevention:** Enforce globally unique entity names within a world, or use Obsidian's path-based wikilink format: `[[Locations/The Keep]]`. The folder-based approach requires exporting entities into typed subdirectories (`/Characters/`, `/Locations/`, etc.) and emitting path-qualified wikilinks in the export. Decide on this convention before the first export implementation — changing it later requires regenerating all wikilinks in all exported files.

**Phase:** Export schema definition phase.

---

### 12. Graph Layout Thrash on Entity Addition

**What goes wrong:** Every time a new entity is added or a relationship is changed, the force-directed layout recalculates from scratch, and all existing nodes jump to new positions. This is disorienting for builders who have manually arranged their graph.

**Prevention:** Persist node positions in the database alongside entity records. Only run auto-layout for nodes that have no stored position. Provide an explicit "Re-layout" button rather than running layout automatically. Use a stable ID-to-position map so existing nodes don't move when new nodes are added.

**Phase:** Graph implementation phase.

---

### 13. YAML Frontmatter Encoding Edge Cases

**What goes wrong:** YAML is strict about special characters. Entity names containing colons, quotes, or leading special characters will break YAML parsing in Obsidian when used as frontmatter values. A character named `Dr. "Bones" MacLeod` will produce invalid YAML if not quoted. A location named `The Keep: North Tower` will break the frontmatter key-value structure.

**Prevention:** Always quote string values in YAML frontmatter output. Use a proper YAML serialization library (e.g., `js-yaml`) rather than template strings when generating frontmatter. Test the exporter against entity names with colons, quotes, angle brackets, and emoji.

**Phase:** Export implementation phase.

---

### 14. Next.js RSC Flight Payload Bloat from Large Entity Objects

**What goes wrong:** Server Components pass entity data as props to Client Components (editor, graph). If the full entity object — including the complete Tiptap JSON document, all relationship data, and all metadata — is passed as a prop, it is serialized onto the RSC Flight payload and sent to the browser on every page load, even for content the client doesn't immediately need.

**Prevention:** Pass minimal props to Client Components — entity ID, name, type. Fetch the full document content on the client via a Server Action or Route Handler triggered by user interaction. For the graph, pass only the node/edge adjacency structure, not full entity objects.

**Phase:** Any phase that adds new Client Component data requirements.

---

### 15. Tiptap Extension Conflicts Between Wikilink and Standard Link

**What goes wrong:** Tiptap's built-in Link extension and a custom Wikilink extension both operate on link-like inline content. If both are registered, they can conflict on parsing: `[[Something]]` that contains a URL may be captured by the Link extension first, or a standard markdown link `[text](url)` may be misidentified as a wikilink fragment. GitHub issue #2231 in the Tiptap repo documents mention/link conflicts causing broken behavior when multiple link-like marks are active.

**Prevention:** Register extensions in the correct order (wikilink before standard link). Write explicit `parseHTML` rules in the wikilink extension that do not match standard link syntax. Test both extension types in the same document before shipping.

**Phase:** Editor extension implementation phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Data model / schema design | No backlink table; no soft delete; no tsvector column; entity names not globally unique within world | Design schema with these constraints on day one |
| Tiptap editor extension | Wikilinks stored by name not ID; no markdown serializer for custom nodes; link extension conflict | Specify node attributes (id + label), implement serializers alongside each extension |
| Rich/markdown mode toggle | Content loss on toggle for custom nodes | Require `renderMarkdown` + `parseMarkdown` on all custom extensions before toggle ships |
| Export implementation | Wikilinks in YAML frontmatter break Obsidian; YAML encoding edge cases; missing fields | Export spec written before entities exist; round-trip CI tests from Phase 1 |
| Graph visualization | Layout thrash; edge animation performance; layout algorithm blocking main thread | Persist positions; disable animations by default; Web Worker for layout |
| Permission / reveal system | Complexity creep; stale cache serving wrong permission state; per-player reveal scope | Formal spec before code; RLS in DB; dynamic rendering for permission-filtered views |
| Player access views | Stale Next.js App Router cache after reveal action | `no-store` or short revalidation on all permission-filtered routes |
| Public discovery | Spam, abuse, trust damage | Rate limiting, email verification, report flag mechanism — must ship with the feature |
| Search | Full table scan at scale | Persisted GIN-indexed tsvector column from first migration |
| Entity deletion | Orphaned wikilinks, ghost graph edges | Soft delete + backlink check + explicit confirmation before any deletion |

---

## Sources

- Tiptap Markdown custom serialization docs: https://tiptap.dev/docs/editor/markdown/advanced-usage/custom-serializing
- Tiptap FAQ on schema content loss: https://tiptap.dev/docs/guides/faq
- React Flow performance guide: https://reactflow.dev/learn/advanced-use/performance
- React Flow layouting overview: https://reactflow.dev/learn/layouting/layouting
- Obsidian internal links: https://obsidian.md/help/links
- Obsidian forum — wikilinks in YAML frontmatter (long-standing unresolved thread): https://forum.obsidian.md/t/wikilinks-in-yaml-front-matter/10052
- Obsidian forum — special characters in filenames: https://forum.obsidian.md/t/obsidian-please-just-create-rename-the-note-minus-the-special-character-we-accidentally-put-in-the-title-instead-of-making-us-start-over/69123
- Next.js RSC performance pitfalls (LogRocket): https://blog.logrocket.com/react-server-components-performance-mistakes
- Next.js cache deep dive discussion: https://github.com/vercel/next.js/discussions/54075
- PostgreSQL full-text search tsvector optimization (Thoughtbot): https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers
- Supabase RLS best practices: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- Tiptap wikilink extension (aarkue): https://github.com/aarkue/tiptap-wikilink-extension
- Tiptap Link+Mention conflict issue #2231: https://github.com/ueberdosis/tiptap/issues/2231
- WorldAnvil permission system patterns (Loreteller): https://loreteller.com/learn/world-anvil-secrets-guide/
- React Flow large graph discussion: https://github.com/xyflow/xyflow/discussions/4975
- Drupal orphaned entity reference handling: https://www.drupal.org/project/drupal/issues/2978521
