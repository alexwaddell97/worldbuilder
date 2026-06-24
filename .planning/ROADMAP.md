# Worldbuilder Roadmap

## Milestone 1: Core Platform

**Goal:** A working worldbuilding platform — auth, worlds, entities, editor with wikilinks, and Obsidian export. A Builder can create a private world, write connected lore, and export it cleanly. No Player/Explorer access, no discovery layer yet.

**Success criteria:** A Builder can sign up, create a world, define entity types, write entities with wikilinks that survive renames, and export the full world as Obsidian-compatible markdown.

---

### Phase 1: Project Foundation

**Goal:** Runnable Next.js app with database, auth shell, and design system configured.

**Scope:**

- Initialize Next.js 15 (App Router, TypeScript strict)
- Configure Tailwind CSS 4.x + shadcn/ui component registry
- Set up Neon PostgreSQL + Drizzle ORM (connection, schema baseline, migrations)
- Define full database schema: `users`, `worlds`, `entity_types`, `entities`, `entity_relations`, `reveal_rules`
- Better Auth 1.6.x wired up (email/password + Google OAuth, email verification)
- Global layout: nav shell, auth-gated routes, Apple-clean typography baseline
- Environment config (`.env.local` template, all secrets externalized)

**UAT:**

- [ ] `npm run dev` starts without errors
- [ ] Auth flow works: signup → email verify → login → logout
- [ ] Drizzle schema runs `migrate` against Neon without errors
- [ ] Authenticated route redirects unauthenticated users to login

---

### Phase 2: World Management

**Goal:** A Builder can create and manage multiple worlds.

**Scope:**

- World CRUD: create, view, edit (name, description, slug), delete (with confirmation)
- World dashboard: list all worlds owned by the current user
- World privacy toggle: private / public (unlisted not needed in v1)
- World-scoped routing: `/worlds/[slug]/...` as the root for all world content
- Multiple worlds per account (no artificial limits in v1)

**Plans:** 2/4 plans executed
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Schema migration (per-user slug), Zod schemas, query helpers, world Server Actions
- [x] 02-02-PLAN.md — Install shadcn primitives (card, dialog, alert-dialog, textarea, badge, dropdown-menu, separator, switch)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-03-PLAN.md — World CRUD UI: dashboard list, create/edit/delete dialogs, privacy toggle, world card

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-04-PLAN.md — World-scoped routing: proxy guard, `/worlds/[slug]` layout + detail shell

**UAT:**

- [ ] Builder can create a world with a name, description, and auto-generated slug
- [ ] Builder's dashboard lists all their worlds
- [ ] Builder can edit world name/description
- [ ] Builder can delete a world (with confirmation dialog)
- [ ] World slug is unique per user account
- [ ] Private world is not accessible to unauthenticated users

---

### Phase 3: Entity Types & Entity Management

**Goal:** A Builder can define entity types and create/manage entities within a world.

**Scope:**

- Built-in entity types: Character, Location, Faction, Item, Event (5 types, seeded on world creation)
- Custom entity type creation: name, slug, icon selection
- Entity CRUD: create, view, edit, delete
- Entity listing per type: filterable, searchable (name/tag full-text)
- Entity slugs: unique within a world, stable for wikilink and export resolution
- Tags: attach free-form tags to entities; filter entity list by tag
- Custom fields: JSONB-backed, defined per entity type, rendered as form fields on entity edit

**Plans:** 4/4 plans executed
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Schema extension (entities table, customFieldsSchema), query helpers, transaction seeding

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Install shadcn primitives (select, tabs, scroll-area, tooltip, popover), icon-picker constants, entity + entity-type server actions

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Icon picker component, entity type dialogs, entity types management page, sidebar entity type nav links

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — Entity form, CRUD dialogs, entity card, entity list page (URL-driven filters), entity detail page, world overview update

**UAT:**

- [x] World is seeded with 5 built-in entity types on creation
- [x] Builder can create a custom entity type with name and icon
- [x] Builder can create an entity of any type
- [x] Entity list filters by type and by tag
- [x] Full-text search returns matching entities by name
- [x] Renaming an entity updates its slug and the slug remains stable for existing wikilinks (UUID-backed)
- [x] Custom fields defined on an entity type appear on the entity edit form

---

### Phase 4: Content Editor (Tiptap + Wikilinks)

**Goal:** A Builder can write rich content in entities with inline wikilinks that survive renames.

**Scope:**

- Tiptap 3.x editor in rich (WYSIWYG) mode
- Markdown toggle: rich ↔ raw markdown — requires complete round-trip serialization for every node
- Wikilink custom extension: `[[Entity Name]]` renders as an interactive inline node; stored as `{id: UUID, label: string}` — **never** stored as plain text name
- Wikilink autocomplete: `[[` triggers a dropdown of entities in the world
- Wikilink resolution: dead links (entity deleted) render with a visual "broken link" indicator — no silent drop
- All custom nodes implement both `parseMarkdown` + `renderMarkdown` handlers before the toggle is exposed
- Auto-save on blur / 2-second idle; no manual save button

**UAT:**

- [ ] Builder can write rich text with headings, lists, bold, italic, blockquotes
- [ ] Typing `[[` opens an entity autocomplete dropdown
- [ ] Selecting an entity from autocomplete inserts a wikilink node
- [ ] Renaming the linked entity updates the displayed label in all documents referencing it (UUID is the stable key)
- [ ] Switching to markdown mode and back preserves all wikilinks
- [ ] Deleting a linked entity renders the wikilink as a broken-link indicator (not silently removed)
- [ ] Content auto-saves; no data loss on tab close after 2-second idle

---

### Phase 5: Relationship Graph

**Goal:** A Builder can define and visualise typed relationships between entities.

**Scope:**

- `entity_relations` table: source → target with typed edge label ("ally of", "parent of", "member of", "located in", "opposes", custom)
- Relationship CRUD on the entity detail page (sidebar panel)
- Visual graph view: force-directed node graph for the world, scoped to visible entities
- Graph UI: click a node → navigate to entity; edge labels visible on hover
- Relationship types are world-scoped and user-definable

**UAT:**

- [ ] Builder can add a typed relationship between two entities
- [ ] Builder can delete a relationship
- [ ] World graph view renders all entities as nodes with edges
- [ ] Clicking a node in the graph navigates to that entity
- [ ] Custom relationship types can be created and reused

---

### Phase 6: Obsidian Export

**Goal:** A Builder can export their entire world as Obsidian-compatible markdown, fulfilling the no-lock-in promise.

**Scope:**

- Export route handler: reads all entities + relationships for a world, serializes to files, returns a ZIP
- File naming: `{entity-slug}.md` — sanitized (no `/\:*?"<>|` chars)
- YAML frontmatter per file: `title`, `entity_type`, `tags`, `custom_fields`, `relationships` (as display-name list — not wikilink syntax inside YAML)
- Body: markdown content with `[[Current Entity Name]]` wikilinks (resolved from UUID → current name at export time)
- Folder structure: entities grouped by type (`characters/`, `locations/`, etc.)
- Export is always available — never behind a paywall gate in v1
- Round-trip test: export world → verify all wikilinks resolve to existing filenames → verify YAML parses cleanly

**UAT:**

- [ ] "Export World" button is visible and accessible to the Builder
- [ ] Download is a valid ZIP file
- [ ] Each entity has a `.md` file with correct YAML frontmatter
- [ ] Wikilinks in body text use current entity names (post-rename), not stale names
- [ ] Relationships appear in YAML frontmatter as a name list (not `[[wikilink]]` syntax)
- [ ] Entities with previously renamed slugs export with current names
- [ ] Obsidian can open the exported vault and resolve wikilinks without manual fixes

---

## Milestone 2: Player Access & Discovery

**Goal:** TTRPG GMs can invite players into their world with a reveal system, and published worlds appear on a public discovery layer.

*(Phases to be planned after Milestone 1 ships)*

**Anticipated phases:**

- Phase 7 — Builder/Player/Explorer Access Model (invite codes, role resolution, session auth scoping)
- Phase 8 — Reveal / Spoiler System (entity-level hidden/revealed toggle, Player view scoped to revealed entities only)
- Phase 9 — Public Discovery Layer (browse worlds, Explorer read-only view, builder profiles)
- Phase 10 — Newsletter / Updates (builder-authored world updates, follow system)

---

## Backlog

- Foundry VTT integration — deferred post-milestone 2
- Real-time collaboration (Yjs multi-cursor) — deferred post-milestone 2
- Mobile native app — web-first; defer indefinitely
- AI-assisted content generation — explicit non-feature (core value)
- Monetization / billing — not decided; defer until post-launch learning
- Interactive maps with pinned entities
- In-world calendar / timeline view
- Section-level reveal granularity (per-player) — complexity risk; assess after Phase 8 ships

---

*Last updated: 2026-06-18 — initial roadmap created from project research*
