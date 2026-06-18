# Architecture Research: Worldbuilder

**Researched:** 2026-06-18
**Confidence:** HIGH (stack decisions are firm; patterns are well-established)

---

## System Components

### 1. Auth & Identity Layer
Handles user registration, login, session management, and role resolution. Determines whether the current user is Builder, Player, or Explorer for a given world. This is the outermost gate — every other system depends on it. Use Next.js middleware + a session token to attach `world_role` to each request context early, avoiding repeated DB lookups in nested components.

### 2. World & Entity Store (Core Database)
The relational heart of the system. Stores worlds, entities (characters, locations, factions, events, custom types), entity custom fields, and relationships as typed edges. PostgreSQL with JSONB for custom/variable fields is the correct model here — see Data Model section for detail.

### 3. Content Editor (Tiptap + Markdown Layer)
The Tiptap editor runs client-side. It manages the toggle between rich (WYSIWYG) and raw markdown modes. This component is responsible for:
- Parsing `[[EntityName]]` wikilinks into internal entity references
- Serializing editor content back to markdown for storage
- Rendering entity mentions as interactive inline nodes

This component talks in one direction to the store: it writes markdown back to the entity `content` field on save, and reads it on load. It is stateless between sessions — there is no real-time sync requirement in v1.

### 4. Reveal / Permission Engine
A cross-cutting concern that sits between the World & Entity Store and any read path. Given a requesting user's role and a target entity/field, it answers: "can this user see this?" The engine resolves reveal state from a `reveal_rules` table joined against the current user's role and any explicit player grants. This is enforced at the application layer (not Postgres RLS), because field-level visibility within a single entity row is too fine-grained for row-level policies.

### 5. Relationship Graph
A separate `relationships` table of typed edges between entities (nodes). Queried by the visual graph view and by wikilink resolution. Edges carry a `type` (e.g., "allied with", "parent of", "located in") and optional metadata. This component is read-heavy and write-sparse.

### 6. Export Engine
Server-side only. Reads entities and relationships for a world, serializes content fields to markdown files with YAML frontmatter, rewrites entity ID references in wikilinks back to human-readable slugs, zips the result, and returns a download. It runs as a Next.js Route Handler. No async job queue needed in v1 — worlds at v1 scale will export in under a second server-side.

### 7. Public Discovery Layer
A separate read-only surface: browse worlds, view entity content as Explorer, follow builders, and receive newsletter-style updates. Architecturally thin — it's mostly a query + rendering layer over the existing entity store with reveal rules applied at the Explorer tier. No separate datastore needed.

---

## Data Model

### Entity Storage: Hybrid Relational + JSONB

Do not store entities as markdown files in a filesystem or object store. Store them as database rows. The content (body text) lives in a `content` column as a markdown string. Structured fields (name, type, created_at, world_id) are normalized columns. Custom/variable fields defined per entity type live in a `custom_fields JSONB` column.

**Why not pure filesystem markdown files?**
- No efficient querying by type, world, or relationship
- No atomic transactions across linked entities
- Permission enforcement becomes a nightmare
- Full-text search requires external indexing

**Why not pure relational (no JSONB)?**
- EAV (Entity-Attribute-Value) pattern for custom fields requires 2+ joins per attribute query and degrades write performance at volume
- Custom field schemas vary per entity type and per world

**Why not ProseMirror JSON as the storage format?**
- ProseMirror JSON is tightly coupled to the editor's extension set — it breaks when extensions change
- Obsidian export requires markdown anyway, so storing markdown avoids a double-serialization step
- Tiptap's `@tiptap/markdown` extension (released Oct 2025) provides verified bidirectional round-trip between markdown and the editor's internal document model, including custom extension support with manual serialization rules

**Schema (simplified):**

```sql
-- worlds
worlds (id, slug, owner_id, name, description, is_public, created_at)

-- entity type definitions (built-in + user-defined)
entity_types (id, world_id, name, slug, icon, is_built_in)

-- entities: the core node
entities (
  id,
  world_id,
  entity_type_id,
  slug,          -- human-readable, stable within a world, used for wikilinks and export
  name,
  content TEXT,  -- markdown body
  custom_fields JSONB,   -- variable fields per entity type
  is_published,
  created_at,
  updated_at
)

-- relationship edges
relationships (
  id,
  world_id,
  from_entity_id,
  to_entity_id,
  relationship_type TEXT,    -- "allied_with", "parent_of", "located_in", etc.
  description TEXT,          -- optional edge label/annotation
  metadata JSONB,            -- direction, weight, etc.
  created_at
)

-- reveal rules
reveal_rules (
  id,
  world_id,
  entity_id,
  field_path TEXT,   -- null = whole entity; "name", "custom_fields.secret_origin", etc.
  visible_to TEXT,   -- "player", "explorer", or specific player_id
  revealed_at TIMESTAMP
)

-- world members (Builder and Player roles)
world_members (
  world_id,
  user_id,
  role TEXT,   -- "builder", "player"
  joined_at
)
```

### Relationship Graph Model: Separate Edge Table

Use a dedicated `relationships` table (labeled property graph model in relational form), not an adjacency list embedded in the entity row. Reasons:
- Edges have their own attributes (type, description, metadata)
- Both directions must be queryable efficiently (who is this character allied with? what factions is this location home to?)
- Graph queries (find all entities within 2 hops) are straightforward with a CTE recursive query against this table
- Indexing `(from_entity_id)` and `(to_entity_id)` separately gives O(1) lookup in both directions

For v1 scale, Postgres handles this cleanly with no graph database (Neo4j, etc.) needed. Graph databases add operational complexity for no benefit until multi-hop traversal queries become a primary workload.

### Reveal / Permission Model: Per-Entity + Per-Field

The reveal system operates at two granularities:

1. **Entity-level reveal**: The entire entity is hidden from Players/Explorers until the Builder explicitly reveals it. This is the default and covers 90% of use cases (hide NPC until players meet them).

2. **Field-level reveal**: Individual fields within an otherwise-visible entity can be hidden. Example: a character's name and appearance are visible, but their secret allegiance (stored in `custom_fields.allegiance`) is not. The `field_path` column in `reveal_rules` encodes this — null means whole-entity, a dotted path string targets a specific field.

3. **Explorer tier**: Explorers (anonymous read-only) only see entities and fields that are marked `visible_to = 'explorer'`. This is a superset of what a Player can see (everything Explorer-visible is also Player-visible, but not vice versa).

Enforce reveal rules in the application layer (a `canSee(user, entity, fieldPath?)` utility), not in Postgres RLS. Field-level visibility cannot be expressed as a Postgres row-level policy on a single row. Application-layer enforcement is also easier to test and reason about. Use RLS only for world-level tenant isolation: a user can only query entities where `world_id` matches a world they are a member of (or the world is public).

---

## Component Interactions

```
Browser
  |
  +-- Next.js App Router (middleware resolves world_role from session + world_members)
        |
        +-- RSC Page (reads entity data, applies reveal filter, renders)
        |     |
        |     +-- Reveal Engine (canSee utility) --> Entity Store (Postgres)
        |
        +-- Client: Tiptap Editor
        |     |
        |     +-- WikiLink Extension (custom Node) --> /api/entities/search?world_id=&q= (Route Handler)
        |     |                                         (populates suggestion list, resolves link on click)
        |     +-- Markdown serializer (@tiptap/markdown + custom WikiLink serializer rules)
        |     +-- Save action (Server Action) --> entity UPDATE content field in Postgres
        |
        +-- Client: Relationship Graph View
        |     |
        |     +-- /api/graph?world_id= (Route Handler) --> relationships + entities query
        |     +-- Renders with D3 or react-force-graph (client-only)
        |
        +-- Route Handler: /api/export?world_id=
              |
              +-- Entity Store: full entity + relationship fetch
              +-- Export Engine: slug-based wikilink rewrite + YAML frontmatter + zip
              +-- Response: file download
```

**Data flow direction summary:**
- Read path: Postgres → Reveal Engine → RSC → client
- Write path: client (Tiptap) → Server Action → Postgres
- Export path: Postgres → Export Engine → HTTP response stream
- Graph path: Postgres → Route Handler → client graph renderer
- Wikilink resolution: client keypress → Route Handler search → suggestion list in editor

---

## Key Architectural Decisions

### Decision 1: Markdown as Storage Format (not ProseMirror JSON)

**Choose markdown stored as TEXT in Postgres.**

Trade-offs:
- Pro: Direct Obsidian export compatibility, human-readable in DB, no editor version coupling
- Pro: Tiptap's `@tiptap/markdown` extension (verified, Oct 2025) handles bidirectional round-trip
- Con: Custom extension nodes (wikilinks) require manual serialization rules in the markdown layer
- Con: Cannot store editor-specific non-markdown features (e.g., inline colors, special blocks) without custom markdown extensions

The wikilink serialization rule is straightforward: a WikiLink node serializes to `[[slug|display name]]` and parses back from the same syntax. This is the same format Obsidian uses, so export compatibility is maintained with zero transformation needed.

### Decision 2: Custom Tiptap WikiLink Node (not the aarkue/tiptap-wikilink-extension package)

**Build a custom WikiLink node extension, do not use the third-party package.**

The `aarkue/tiptap-wikilink-extension` package has 7 commits, 5 stars, no npm publication, and no releases. It requires gitpkg.now.sh installation with manual build steps. This is an unacceptable dependency for a production platform.

The correct approach is a ~150-line custom Tiptap Node extension that:
1. Matches `[[...]]` syntax during input (input rule)
2. Renders as an inline chip node (NodeView with React component)
3. On type-ahead: queries `/api/entities/search` and shows a suggestion popover (reuse `@tiptap/extension-mention` pattern)
4. Stores `entityId` and `displayName` as node attributes
5. Serializes to `[[slug|Display Name]]` for markdown storage
6. Parses `[[slug|Display Name]]` and `[[slug]]` back to the node on load

The `@tiptap/extension-mention` provides the suggestion/popover pattern as a reference, but the WikiLink node needs its own type because it must store entity IDs (not just display strings) and serialize to wikilink syntax.

### Decision 3: Application-Layer Reveal Enforcement (not Postgres RLS)

**Enforce field-level visibility in the application service layer.**

Postgres RLS is excellent for row-level multi-tenant isolation (enforce `world_id` ownership). It cannot express "hide this JSON subfield from this user role." Attempting to shoehorn field-level visibility into RLS leads to either: (a) splitting field data across multiple tables, which breaks the hybrid schema model, or (b) using column-level privileges, which cannot be made dynamic per entity.

The reveal engine is a pure function: `canSee(userRole: 'builder'|'player'|'explorer', revealRules: RevealRule[], fieldPath?: string) => boolean`. It is called during the RSC render pass before serializing entity data to the client. Builders receive the full entity; Players and Explorers receive a filtered view.

### Decision 4: Separate Edge Table for Relationships (not embedded)

**Store relationships in a dedicated `relationships` table.**

Do not embed relationship IDs in a JSONB array on the entity row. Embedding breaks: bilateral queries, edge attribute storage, relationship type indexing, and graph traversal queries. The separate edge table allows both `from_entity_id` and `to_entity_id` to be indexed independently, making "all relationships for entity X" a single indexed lookup in either direction.

### Decision 5: Entity Slugs as the Wikilink Key (not entity IDs)

**Wikilinks resolve by slug, not UUID.**

Obsidian resolves wikilinks by filename. Worldbuilder must match this for export compatibility. The `slug` column on entities is human-readable, stable within a world, and unique per world (enforced by a `UNIQUE(world_id, slug)` constraint). During export, the Export Engine writes `[[slug]]` syntax directly — no UUID-to-slug translation needed because slugs are the canonical reference in markdown storage. In the editor, the WikiLink node stores both `entityId` (UUID) for fast DB lookup and `slug` for serialization.

### Decision 6: Next.js Route Scoping by World Slug

**Route structure: `/worlds/[worldSlug]/` for world-scoped pages.**

Use path-based routing (not subdomain) for v1. Subdomain routing adds DNS/SSL complexity for no UX benefit at this scale. The `[worldSlug]` dynamic segment is resolved by middleware into a world record + current user's role. This world context is passed via React context or layout-level data fetch to all nested routes.

Public discovery lives at `/discover/` with no world context. Builder workspace lives at `/worlds/[worldSlug]/workspace/`. Player view lives at `/worlds/[worldSlug]/play/`. Explorer view is `/worlds/[worldSlug]/` (public root).

---

## Suggested Build Order

Each phase depends on the previous one being stable enough to build on top of. The ordering below follows strict data dependency chains.

### Phase 1: Foundation (Auth + World + Entity CRUD)
Build: Auth (sign up, login, session), world creation, entity CRUD with markdown editor (no wikilinks, no reveal).
Why first: Everything else requires authenticated users, worlds, and entities. The markdown editor in basic form unblocks all subsequent content work.

### Phase 2: WikiLink Extension + Relationship Graph
Build: Custom WikiLink Tiptap node, entity search endpoint, relationship CRUD, graph visualization.
Depends on: Phase 1 (entities must exist to link and relate)
Why here: Wikilinks and relationships are tightly coupled — you create a relationship by linking entities. The graph view needs the relationship table populated.

### Phase 3: Reveal / Permission System
Build: `reveal_rules` table, reveal engine utility, Player role + world_members, Builder reveal controls.
Depends on: Phase 1 (entities), Phase 2 (relationships also need reveal rules — a relationship itself may be hidden)
Why here: Cannot test reveal without entities to reveal. Defer until the entity model is stable to avoid schema churn on reveal_rules.

### Phase 4: Export Engine
Build: Markdown export with YAML frontmatter, slug-based wikilink rewrite, zip download.
Depends on: Phase 1 (entity schema must be finalized), Phase 2 (relationships must be exportable), Phase 3 (export should respect what a Builder owns — not filtered by reveal, since Builder sees all)
Why here: Export format is sensitive to schema stability. Doing it after Phase 3 means the entity + relationship schema is settled.

### Phase 5: Public Discovery Layer
Build: World public toggle, discover/browse page, Explorer access tier, newsletter/update posts.
Depends on: Phase 3 (reveal rules determine what Explorers see)
Why here: Requires the full permission stack to be correct before opening worlds to anonymous access.

### Phase 6: Polish + Custom Entity Types
Build: User-defined entity types, custom field definitions, entity type management UI.
Why last: Custom fields touch the `custom_fields JSONB` column and `entity_types` table but do not affect the core schema. Doing this last avoids designing around an uncertain custom fields model during earlier phases.

---

## Open Questions

1. **Wikilink slug collision on rename**: If a Builder renames an entity (changing its slug), all `[[old-slug]]` references in markdown content across the world become broken. Resolution strategies: (a) immutable slugs with display-name override, (b) slug history table with redirect, (c) scan-and-rewrite on rename. Need a decision before Phase 2 ships.

2. **Inline reveal (secrets within content body)**: LegendKeeper supports hiding specific blocks of text within an otherwise-visible article. The current model only reveals at entity level or named field level. If inline spoilers within the markdown body are needed, the content field must become structured (not plain markdown) or use a markdown extension syntax like `:::secret ... :::`. Defer decision to Phase 3, but flag it.

3. **Graph visualization library**: D3.js (flexible, complex) vs react-force-graph (simpler, less control) vs Cytoscape.js (feature-rich, large bundle). Decision needed before Phase 2 starts. Preliminary lean: react-force-graph for v1 velocity, migrate to Cytoscape if graph UX becomes a differentiator.

4. **Full-text search scope**: Postgres `tsvector` on the `content` + `name` columns gives basic full-text search within a world at no added infrastructure cost. Sufficient for v1. If cross-world discovery search is needed (search all public entities across all worlds), evaluate pg_search or external indexing then.

5. **Relationship directionality**: Some relationships are directional ("rules over" implies A rules B, not B rules A), others are symmetric ("allied with"). The current schema stores a single `from/to` pair. Need a `is_directed BOOLEAN` flag or a convention (always query both directions for symmetric types). Decide in Phase 2.

6. **Player-created content**: The PROJECT.md notes Players "may add session notes or character data." This implies Players have limited write access within a world. The current model only defines Players as readers within a revealed scope. Write access for Players needs a data model decision — specifically, whether Player-created entities are scoped privately to the Player or visible to the Builder.
