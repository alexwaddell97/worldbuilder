# Worldbuilder Roadmap

## Milestone 1: Core Platform

**Goal:** A working worldbuilding platform — auth, worlds, entities, editor with wikilinks, and Obsidian export. A Builder can create a private world, write connected lore, and export it cleanly.

**Status: COMPLETE** *(all 6 phases shipped, plus Maps and Writing beyond original scope)*

---

### Phase 1: Project Foundation ✓

**Goal:** Runnable Next.js app with database, auth shell, and design system configured.

**UAT:**
- [x] `npm run dev` starts without errors
- [x] Auth flow works: signup → email verify → login → logout
- [x] Drizzle schema runs `migrate` against Neon without errors
- [x] Authenticated route redirects unauthenticated users to login

*Also shipped: 2FA setup/verification, Google OAuth*

---

### Phase 2: World Management ✓

**Goal:** A Builder can create and manage multiple worlds.

**UAT:**
- [x] Builder can create a world with a name, description, and auto-generated slug
- [x] Builder's dashboard lists all their worlds
- [x] Builder can edit world name/description
- [x] Builder can delete a world (with confirmation dialog)
- [x] World slug is unique per user account
- [x] Private world is not accessible to unauthenticated users

*Also shipped: public share URL (publicSlug), world creation presets (e.g. "Fantasy RPG"), world avatar*

---

### Phase 3: Entity Types & Entity Management ✓

**Goal:** A Builder can define entity types and create/manage entities within a world.

**UAT:**
- [x] World is seeded with 5 built-in entity types on creation
- [x] Builder can create a custom entity type with name and icon
- [x] Builder can create an entity of any type
- [x] Entity list filters by type and by tag
- [x] Full-text search returns matching entities by name
- [x] Renaming an entity updates its slug and the slug remains stable for existing wikilinks (UUID-backed)
- [x] Custom fields defined on an entity type appear on the entity edit form

*Also shipped: per-entity and per-entity-type public visibility toggles, image upload on entities*

---

### Phase 4: Content Editor (Tiptap + Wikilinks) ✓

**Goal:** A Builder can write rich content in entities with inline wikilinks that survive renames.

**UAT:**
- [x] Builder can write rich text with headings, lists, bold, italic, blockquotes
- [x] Typing `[[` opens an entity autocomplete dropdown
- [x] Selecting an entity from autocomplete inserts a wikilink node
- [x] Renaming the linked entity updates the displayed label in all documents referencing it (UUID is the stable key)
- [x] Switching to markdown mode and back preserves all wikilinks
- [x] Deleting a linked entity renders the wikilink as a broken-link indicator (not silently removed)
- [x] Content auto-saves; no data loss on tab close after 2-second idle

*Also shipped: focus mode, typewriter mode, save status indicator (saving/saved/error), wikilink preview drawer on click*

---

### Phase 5: Relationship Graph ✓

**Goal:** A Builder can define and visualise typed relationships between entities.

**UAT:**
- [x] Builder can add a typed relationship between two entities
- [x] Builder can delete a relationship
- [x] World graph view renders all entities as nodes with edges
- [x] Clicking a node in the graph navigates to that entity
- [x] Custom relationship types can be created and reused

*Also shipped: wikilink-derived edges shown alongside explicit relations, Dagre auto-layout, node filtering by type/tag, drag-to-create relation mode, node position persistence, hidden entity/type storage, entity preview drawer on node click, read-only public graph view*

---

### Phase 6: Obsidian Export ✓

**Goal:** A Builder can export their entire world as Obsidian-compatible markdown.

**UAT:**
- [x] "Export World" button is visible and accessible to the Builder
- [x] Download is a valid ZIP file
- [x] Each entity has a `.md` file with correct YAML frontmatter
- [x] Wikilinks in body text use current entity names (post-rename), not stale names
- [x] Relationships appear in YAML frontmatter as a name list (not `[[wikilink]]` syntax)
- [x] Entities with previously renamed slugs export with current names
- [x] Obsidian can open the exported vault and resolve wikilinks without manual fixes

*Also exported: images (entity + map), writing documents (in projects folder structure), world summary (world.md), relationships table*

---

### Phase 7: Maps *(shipped outside original roadmap)* ✓

**Goal:** A Builder can upload maps and place pins linked to entities.

**Shipped:**
- Map CRUD with optional parent-child hierarchy (world → region → town → dungeon)
- High-resolution image upload via Vercel Blob
- Pin placement: point-to-entity and point-to-child-map pins
- Pin customization (icon, color, border)
- Map tree browser for hierarchy navigation
- Public map viewer (read-only)
- Map images included in Obsidian export ZIP

---

### Phase 8: Writing *(shipped outside original roadmap)* ✓

**Goal:** A Builder can write long-form documents (stories, session notes) within a world.

**Shipped:**
- Writing documents with Tiptap editor (same wikilink/autocomplete system)
- Writing projects as containers for organizing documents
- Word count tracking + word target per document
- Document publish toggle (isPublished flag)
- Public story viewer at `/w/[worldSlug]/stories/[docSlug]`
- Writing docs included in Obsidian export ZIP

---

## Milestone 2: Player Access & Discovery

**Goal:** TTRPG GMs can invite players into their world with a reveal system, and published worlds appear on a public discovery layer.

**Status: Partially started** — public read-only routes are already live; three-tier access model and reveal system not yet built.

**Already implemented from this milestone:**
- Public world routes (`/w/[worldSlug]/*`) — read-only Explorer-level access
- Per-entity and per-entity-type public visibility toggles
- Public share URL (publicSlug) on worlds
- Public relationship graph (read-only)
- Public map viewer (read-only)
- Public story viewer (read-only)

**Remaining phases:**

- Phase 9 — Builder/Player/Explorer Access Model (invite codes, Player role, session auth scoping for `/w/` routes)
- Phase 10 — Reveal / Spoiler System (entity-level hidden/revealed toggle, Player view scoped to revealed entities only)
- Phase 11 — Public Discovery Layer (browse/search published worlds, builder profiles, world cards)
- Phase 12 — Newsletter / Updates (builder-authored world updates, follow system)

---

## Backlog

- Global spotlight search (Cmd+K) — ✓ shipped: full-text search across entities and writing/stories in a world, with snippet highlighting
- Timeline / chronicle view for Event entities — Chronicle, Gantt, and Calendar layouts; custom world calendar builder
- Game-icons icon system — ✓ shipped: 4,134 game-icons replacing Lucide throughout the platform; searchable picker with curated defaults; platform nav icons decoupled from entity type picker to avoid sidebar clashes
- Advanced map features — Layers, Region Drawing, Pin Grouping, Tokens, Fog of War, Text Annotations
- Community marketplace — template and asset sharing, evolving from the discovery layer
- Rich embedded media — audio, video, and embeds inline in entity and writing content
- Nested page hierarchy — folder/tree structure within a world (currently flat entity-by-type model)
- Entity templates — clone entity with prefilled content/custom fields
- Cascade delete on entity type — ✓ shipped: deleting an entity type now deletes all its entities (warning shown in dialog)
- Foundry VTT integration — deferred post-milestone 2
- Real-time collaboration (Yjs multi-cursor) — deferred post-milestone 2
- Mobile native app — web-first; defer indefinitely
- AI-assisted content generation — explicit non-feature (core value)
- Monetization / billing — not decided; defer until post-launch learning

---

*Last updated: 2026-06-30 — spotlight search shipped; game-icons icon system shipped across platform; entity type cascade delete shipped*
