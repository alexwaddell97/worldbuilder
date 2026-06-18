# Features Research: Worldbuilder

**Domain:** Worldbuilding platform (fiction authors + TTRPG GMs)
**Researched:** 2026-06-18
**Confidence:** HIGH for table stakes (well-established patterns); MEDIUM for differentiators (fewer direct comparators for the specific Builder/Player/Explorer model)

---

## Competitive Landscape

### World Anvil
The market incumbent. Extremely feature-dense: wiki articles, interactive maps, timelines, custom calendars, campaign management, character sheets, subscriber groups, secrets/reveal system, novel-writing modules, community browsing. Has a secrets system with per-subscriber visibility groups. Its core failure is self-inflicted: years of feature accretion have made it overwhelming for newcomers ("takes weeks to feel comfortable"), the editor is widely described as "stuck in the 2000s," and its pricing model is predatory — free tier was retroactively capped at 42 articles, and subscriber limits are gated at expensive tiers ($10-20/month for 10-100 subscribers). Users report aggressive upselling and ads on free tier. Despite this, it has the largest community (3.5M+ users) and widest feature surface.

**What World Anvil gets right:** Secrets system per subscriber group, structured article templates, interactive maps with visibility-controlled pins, timeline with in-world calendar, community browse by genre tag.

**What World Anvil gets wrong:** Editor quality, pricing aggression, UX complexity, visual clutter, feature bloat as a substitute for design.

### Kanka (open source)
Clean, modular, ~400K users. Free tier includes all core features (unlimited entities). Paid tier ($5/month "Owlbear") unlocks visual relation explorer, dashboards, advanced permissions. Covers ~20 entity types. Permissions are granular: roles per campaign, visibility per entity, pin-level map visibility, GM perspective preview. Interface is "utilitarian" — functional but not beautiful. EU-hosted, open source (no lock-in). Weakness: lacks strong discovery layer, no public browsing community, not writer-first.

### LegendKeeper
The design-quality contender. Clean, minimal, fast. Positioned toward GMs running active campaigns rather than long-term worldbuilding archives. Secrets are inline: hidden text blocks within wiki pages revealed per player. Real-time collaboration. Maps up to 100MB (vs World Anvil's 25MB). Single flat price, no ads. Weakness: less structured entity templating than World Anvil/Kanka, limited public discovery layer, no author-facing newsletter/sharing model.

### Campfire Write
Author-first, modular. Pay per module ($2/module/month). Strong character relationships, scene breakdowns, magic systems, language creation. Interactive maps (image-based with pins). Not GM/player aware — no access tiers. Not community-facing. Best for fiction authors who are plotters; poor fit for TTRPG GMs.

### Notebook.ai
Prompt-driven worldbuilding ("what questions to answer about your character"). Templates with guided prompts. Simple, low learning curve. Cross-referencing. Very author-focused, no GM tools. Community forum but no public world discovery. Premium unlocks 25+ additional templates. Not competitive on editor or features but wins on approachability.

### Obsidian / Notion (DIY setups)
Large population of worldbuilders uses these as workarounds, not purpose-built tools. Obsidian: local-first, markdown, wikilinks, graph view, zero cloud sharing, maximum portability. Notion: database-as-document model that "fights the connected-note nature of worldbuilding" — most migrate within 6 months. Both signal unmet demand: users want data ownership AND beautiful tooling AND connected lore, and no current tool delivers all three.

### Key gap the project can exploit
No current tool cleanly serves both fiction authors AND GMs in a single platform while also offering: (1) a beautiful, minimal editor; (2) a principled no-lock-in export guarantee; (3) a player-facing reveal/spoiler model as a first-class design concept rather than an afterthought; (4) a public discovery layer that functions as author portfolio + GM campaign showcase.

---

## Table Stakes

Features users expect in any worldbuilding platform. Missing = users don't consider the product.

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Article/entity creation with rich text editor | Core content unit of any wiki or worldbuilding tool | Medium | Tiptap is the decided stack; must handle wikilinks inline |
| Built-in entity types (characters, locations, factions, items, events) | Every competitor offers these; users arrive expecting to find them | Low-Medium | ~5-8 pre-defined types covers 90% of needs |
| Entity-to-entity linking (wikilinks) | "Everything connects" is the entire value proposition of a worldbuilding wiki | Medium | `[[Entity Name]]` syntax, must resolve and render as links |
| Full-text search across a world | Users create hundreds of entities; search is how they navigate | Medium | Must search names, content, tags |
| Tagging and categorization | Organizational layer above entity types | Low | Tags + categories/folders are both expected |
| Image/asset attachment to entities | Characters need portraits; locations need maps; items need illustrations | Medium | Storage limits are a business model decision, not a feature decision |
| World-level privacy settings | Worlds must be private by default; public sharing opt-in | Low | Per-world visibility toggle (private / unlisted / public) |
| Secure account system | Cloud product baseline | Low | Auth, email, password reset |
| Multiple worlds per account | Authors and GMs commonly maintain 2-5 worlds simultaneously | Low | No competitor limits this meaningfully |
| Mobile-responsive reading | Explorers and Players will access on phone | Low | Read-only responsive is sufficient for v1; edit is secondary |
| Export / data portability | "No lock-in" is now an expectation, especially post-World-Anvil backlash | Medium | Obsidian-compatible markdown+YAML is the gold standard; must be first-class not buried |
| Relationship tracking between entities | Every competitor has this; Kanka makes it core | Medium | Typed edges (ally, enemy, parent, member-of, etc.) |

---

## Differentiators

Features that create genuine competitive advantage. Not universally expected but highly valued when done well.

### 1. Builder / Player / Explorer Access Model (Core Differentiator)

**Value proposition:** No competitor cleanly implements three distinct access tiers as first-class UX. World Anvil has subscriber groups (complex, expensive, GM-facing UI). Kanka has roles per campaign. LegendKeeper has secrets but no formal Player tier. None of them treats "Explorer" (anonymous public reader) as a designed persona.

**What this means to build:**
- Builder: full create/edit access, owns the world
- Player: joins via invite code, sees only what Builder has revealed, may contribute session notes or character data within their own scope
- Explorer: anonymous, reads public worlds via discovery layer with no account required

**Complexity:** High. The access model shapes every data query, every UI rendering path, every API endpoint. It must be designed into the schema from day one or it becomes a rewrite.

**Why it wins:** TTRPG GMs have been hacking World Anvil's subscriber system and Kanka's permission system because neither was designed around the GM-player mental model. This platform speaks their language natively.

---

### 2. Progressive Reveal / Spoiler System (Core Differentiator)

**Value proposition:** GMs need to build a world in full, then progressively unlock pieces for players as the campaign unfolds. Current tools treat this as a permissions bolt-on. This should be a first-class authoring primitive.

**Mechanics to implement:**
- Inline spoiler blocks within an entity's content (hidden from Players until revealed)
- Whole-entity reveal (entity doesn't appear in Player's world view at all until revealed)
- GM "preview as Player" mode — see exactly what a specific Player or Player group sees
- Reveal actions during session: one-click "reveal this to players" without leaving the article

**Complexity:** High. Requires: dual-render of content (GM view vs Player view), reveal state stored per entity or per block, real-time (or near-real-time) propagation when GM reveals during a session.

**Why it wins:** World Anvil has a secrets system but it's document-level, not block-level in the editor. LegendKeeper has inline secrets but no formal Player role. Kanka has entity-level visibility but the UX is buried in permissions settings. None has a "reveal right now in session" action that's fast and obvious.

---

### 3. Visual Relationship Graph

**Value proposition:** Interconnected lore is the entire point. A visual graph view — entities as nodes, relationships as typed edges — makes the web of connections tangible. World Anvil community forums have had active feature requests for years for a proper graph; Kanka gates it behind premium. Obsidian users explicitly cite the graph view as why they use Obsidian for worldbuilding despite its UX friction.

**Mechanics:**
- Force-directed or hierarchical graph of all entities
- Typed, labeled edges (ally, enemy, parent, child, member-of, rules, location-of, etc.)
- Click node to navigate to entity
- Filter by entity type or relationship type
- Per-access-tier rendering (Players see only revealed entities in their graph)

**Complexity:** Medium-High. Graph rendering itself (D3.js or vis.js) is well-solved; the complexity is maintaining edge data efficiently and rendering a filtered view per access tier.

**Why it wins:** This is the "Obsidian graph but in a cloud platform" that the worldbuilding community clearly wants and no cloud tool delivers well.

---

### 4. Markdown-First Editor with Rich Toggle

**Value proposition:** The worldbuilding community skews toward writers who are comfortable with markdown. Current tools force a choice: either raw markdown (Obsidian, Chronicler) or rich editor (World Anvil's old-style editor, Notion). The ideal is toggle-per-preference with lossless conversion.

**Mechanics (Tiptap already decided):**
- Rich mode: WYSIWYG, formatting toolbar, inline wikilink autocomplete
- Raw mode: raw markdown, [[wikilink]] syntax, YAML frontmatter visible
- Seamless toggle, same document

**Complexity:** Medium. Tiptap supports this natively. The complexity is in the wikilink extension (must autocomplete entity names, create entity stubs on broken links).

**Why it wins:** World Anvil's editor is the top complaint from users. Campfire and LegendKeeper have better editors but not markdown-native.

---

### 5. Public Discovery Layer as Author Portfolio

**Value proposition:** World Anvil has a browse-by-genre community, but it's noisy and algorithmically neutral. Campfire has an "Explore" page. None treats public world-sharing as an author portfolio + newsletter model where Builders actively publish updates (short stories, lore reveals, dev logs) that Followers receive.

**Mechanics:**
- Public world profile: cover image, world summary, genre tags, entity count
- Browse/search public worlds by genre, tags, recency
- Follow system: Explorer or Player can follow a world, receive updates in feed
- Builder "newsletter post": long-form update published to followers (lore reveal, short story, session recap)
- No algorithmic feed — reverse-chronological by followed worlds only

**Complexity:** Medium. The world profile and browse are straightforward; the follow + newsletter post system adds a content publishing layer.

**Why it wins:** Fiction authors want an audience for their worldbuilding, not just a storage tool. GMs want to share campaigns publicly after they finish. Neither audience is served well by current platforms.

---

### 6. Obsidian-Compatible Export as a First-Class Feature

**Value proposition:** Data portability is now a trust signal, not just a utility feature. World Anvil's export is buried and incomplete. Most tools export in proprietary formats.

**Mechanics:**
- Every entity exports as a markdown file with YAML frontmatter
- Entity references export as `[[Entity Name]]` wikilinks
- Folder structure mirrors world organization
- All assets (images) exported with relative paths
- Export available at any time from world settings, not gated behind support requests
- Export is lossless: re-import should reconstruct the world

**Complexity:** Medium. Output format is well-defined. Complexity is in ensuring wikilink resolution round-trips cleanly and all assets are bundled.

**Why it wins:** The "data belongs to you, always" positioning is a direct counter to World Anvil's retroactive free tier caps and customer backlash. It becomes a trust signal in marketing.

---

### 7. Custom Entity Types

**Value proposition:** Every world is different. A sci-fi world needs "Starships" and "Factions." A fantasy world needs "Deities" and "Spells." Pre-defined types cover 80% of needs but custom types cover the 20% that makes a world feel fully realized.

**Mechanics:**
- Builder defines custom entity type with a name, icon, and optional custom field schema
- Custom types appear in navigation alongside built-in types
- Custom types participate in relationships, wikilinks, graph, and export

**Complexity:** Medium. Schema-per-type stored in world config; entity records reference their type. The complexity is in the custom field UI and ensuring export/import handles dynamic schemas.

**Why it wins:** Campfire has rigid module-based types. World Anvil has ~40 templates but they're not user-definable as first-class types. Kanka has ~20 fixed types. Custom types is a meaningful differentiator for power users.

---

### 8. In-World Timeline / Calendar

**Value proposition:** Worldbuilders need to track history. GMs need to track campaign events. Custom in-world calendars (non-Gregorian months, moons, seasons) are a hallmark feature of serious worldbuilding tools.

**Mechanics:**
- Custom calendar: define months, week length, year length, moons
- Timeline view: entities and events plotted against in-world date
- Event entities can be linked to calendar dates
- Per-access-tier: Players see only events on revealed entities

**Complexity:** Medium-High. Custom calendar math is non-trivial (especially moon phases, leap-year equivalents). Timeline visualization is Medium. The intersection with the reveal system adds coordination complexity.

**Why it wins:** Fantasy Calendar is a standalone tool that exists purely because no worldbuilding platform does custom calendars well enough. This is an obvious integration point.

---

## Anti-Features

Things to deliberately NOT build, with reasoning.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| AI content generation | Explicit product principle; damages trust with the core user base (authors and GMs who build worlds as creative practice); AI-generated content in a world wiki is specifically what users are fleeing from — it's been called out as a trust-breaking feature in competitor platforms | Never build it; make the absence a marketing statement |
| Algorithmic discovery feed | Algorithmic feeds create anxiety, comparison, and noise; worldbuilding is a slow creative practice incompatible with engagement-optimization; Substack/Ghost's non-algorithmic model is the right reference | Reverse-chronological follow feed only |
| Advertising | Destroys the clean aesthetic; World Anvil's ad-supported free tier is a top complaint; ads and "Apple-clean" are mutually exclusive | Revenue through subscriptions only |
| Real-time multi-cursor collaboration | High engineering complexity; scope risk; the actual use case (GM + players) is asynchronous by nature — GMs prep between sessions, not live with players editing simultaneously | Async contribution model for Players; defer real-time collab to v2 |
| Native mobile app (iOS/Android) | Platform-specific development cost; web-first responsive covers Explorer and Player reading needs; Builder editing on mobile is not a primary workflow | Responsive web for read; prioritize mobile editing UX in v2 |
| Foundry VTT integration | High complexity, niche audience (VTT-specific), technical spec unknown, not a first-session need | Explicitly deferred to future milestone |
| Built-in map creation / drawing tools | Map creation (Inkarnate, Wonderdraft, Dungeondraft) is a solved problem with dedicated tools that worldbuilders already use; building a map editor would be years of work for an inferior result | Support image upload + pin overlay; let users create maps in their preferred tool then import |
| Character sheet / dice roller / VTT features | Mission creep into VTT territory (Roll20, Foundry, Alchemy); worldbuilder ≠ game runner | Entity fields can represent stats; dedicated VTT features are explicitly out |
| Social features (likes, comments on entities) | This is a worldbuilding tool, not a social platform; comment threads on world articles create noise; the newsletter/update model is sufficient social layer | Follow + newsletter post covers the social surface needed |
| Monetization tools for Builders (selling worlds) | Marketplace complexity; IP/legal risk; not a validated user need for v1 | Out of scope for v1 entirely |

---

## Feature Complexity Matrix

| Feature | Effort | Blocking Other Features | Notes |
|---------|--------|------------------------|-------|
| Auth + account system | Low | Yes — everything | Standard; Next-Auth or Supabase Auth |
| World creation + management | Low | Yes — all content | Schema decision: worlds contain entities |
| Entity CRUD (built-in types) | Low-Medium | Yes — relationships, graph | Define the 6-8 core types upfront |
| Rich/markdown editor (Tiptap) | Medium | Yes — wikilinks, export | Tiptap already decided; wikilink extension is custom work |
| Wikilink autocomplete + resolution | Medium | Yes — graph, export | Must know all entity names in world; suggest on `[[` |
| Relationship system (typed edges) | Medium | Yes — graph | Store edge: source_entity, target_entity, type, label |
| Full-text search | Medium | No | Postgres full-text or dedicated search index |
| Builder/Player/Explorer access model | High | Yes — reveal system, all data queries | Must be in schema from day one; affects every endpoint |
| Progressive reveal / spoiler system | High | Depends on access model | Requires dual-render, reveal state per entity/block |
| Visual relationship graph | Medium-High | Depends on relationships | Graph rendering is solved; complexity is filtered views |
| Public world discovery + browse | Medium | Depends on world privacy settings | World profile, genre tags, search index |
| Follow + newsletter post | Medium | Depends on discovery | Follow model + post creation + follower notification |
| Custom entity types | Medium | Depends on entity CRUD | Dynamic schema per type; export must handle |
| In-world timeline + custom calendar | Medium-High | Depends on entity types | Calendar math, timeline viz, reveal-aware |
| Interactive maps (upload + pins) | Medium | Depends on entity linking | Image upload, pin overlay, pin-to-entity link |
| Obsidian-compatible export | Medium | Depends on all content features | Output format known; round-trip fidelity is the hard part |
| Image/asset management | Medium | Depends on entities, maps | Storage provider, image sizing, asset-to-entity association |
| Tags + folders | Low | No | Organization layer; implement after core entities |

---

## Dependencies

Feature dependency graph — each feature requires those it points to.

```
Auth + account
  └── World creation + management
        ├── Entity CRUD (built-in types)
        │     ├── Rich/markdown editor (Tiptap)
        │     │     └── Wikilink autocomplete + resolution
        │     ├── Relationship system (typed edges)
        │     │     └── Visual relationship graph
        │     ├── Full-text search
        │     ├── Tags + folders
        │     ├── Custom entity types
        │     └── Image/asset management
        │
        ├── Builder/Player/Explorer access model  ← must be designed before any of these
        │     ├── Progressive reveal / spoiler system
        │     │     └── (requires dual-render in editor + reveal state)
        │     ├── Public world discovery + browse
        │     │     └── Follow + newsletter post
        │     └── Visual relationship graph (filtered view)
        │
        ├── In-world timeline + custom calendar
        │     └── (requires entity types + access model for reveal-aware view)
        │
        ├── Interactive maps (upload + pins)
        │     └── (requires entity linking + access model for pin visibility)
        │
        └── Obsidian-compatible export
              └── (requires all content features to be stable before export is complete)
```

**Critical path implication:** The Builder/Player/Explorer access model is the single highest-leverage architectural decision. It must be fully designed before building the editor, the reveal system, the graph, the maps, and the discovery layer — all of which have access-tier-aware rendering requirements. Getting this wrong means rewriting all data queries later.

**Second critical dependency:** Wikilink resolution (knowing all entity names in a world) is required by the editor, the export, and the graph. It should be implemented as a shared lookup service, not baked into each feature separately.

---

## Sources

- World Anvil feature overview and review: https://www.automateed.com/world-anvil-review, https://dlmethod.com/world-anvil-review-is-it-worth-using-for-worldbuilders/
- World Anvil secrets/spoiler system: https://www.worldanvil.com/learn/secrets/secrets, https://loreteller.com/learn/world-anvil-secrets-guide/
- World Anvil user complaints: https://www.trustpilot.com/review/worldanvil.com
- Kanka features: https://kanka.io/features, https://docs.kanka.io/en/latest/overview.html
- LegendKeeper features and comparison: https://www.legendkeeper.com/, https://www.legendkeeper.com/world-anvil-alternative
- Campfire Write review: https://kindlepreneur.com/campfire-write-review/, https://reedsy.com/blog/guide/book-writing-software/campfire-write-review/
- Multi-platform comparison: https://stormscape.app/blog/world-anvil-vs-legendkeeper-vs-kanka-vs-stormscape
- Obsidian vs Notion for worldbuilding: https://www.quillandsteel.com/blogs/writing-tips/notion-vs-obsidian-worldbuilding
- Data portability and lock-in: https://chronicler.pro/best-worldbuilding-tools
- TTRPG reveal system survey: https://loretheca.com/, https://phd20.com/blog/ultimate-guide-ttrpg-campaign-managers/
- User reviews comparison: https://technicalustad.com/best-world-anvil-alternatives/
