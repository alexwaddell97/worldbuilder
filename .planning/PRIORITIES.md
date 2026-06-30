# Build Priorities

*Last updated: 2026-06-29*

Goal: ship an alpha that matches and exceeds LegendKeeper's full roadmap (including their unshipped planned features), undercut on price, and own the fiction author market they ignore.

---

## Tier 1 — Quick wins (days, not weeks)

**1. Genre icon sets**
Install `@iconify/react`, curate ~60 icons per genre (fantasy, sci-fi, horror) from game-icons.net, update the icon picker with a two-tab UI (General / Theme Icons). Namespaced as `gi:dragon` etc. — backward compatible with existing Lucide strings in DB.

**2. Remove markdown toggle**
Strip the live rich ↔ raw markdown mode from the Tiptap editor. The Obsidian export is the markdown portability story — no in-app toggle needed. `@tiptap/markdown` package stays (used by export). Unblocks all future editor work — new extensions no longer need markdown serializers.

**3. Inline images in editor body**
Install `@tiptap/extension-image`, wire up a toolbar button with file upload to the existing `/api/upload` endpoint. Separate from the entity cover image — this is inline images inside content.

---

## Tier 2 — Complete the product (Milestone 2)

**4. Player access + reveal system + discovery layer**
The most important thing. Without it: a private worldbuilding tool. With it: a platform.
- Explorer routes already live (public read-only) — Player role and reveal system are not built
- GMs cannot meaningfully evaluate the product without the reveal system
- Writers cannot share or publish their worlds
- Phases: Player/Builder/Explorer access model → Reveal/spoiler system → Public discovery layer → Newsletter/updates

---

## Tier 3 — Differentiation (the "dwarf LK" features)

**5. Spotlight search with semantic**
Cmd+K global search across all entities, maps, and writing. Hybrid: fast keyword/FTS for exact matches + semantic embeddings for natural language queries ("who rules the northern kingdom", "characters who betrayed someone"). Powered by pgvector on Neon + `text-embedding-3-small` via Vercel AI Gateway. Do not market as "AI search" — the search is the feature. Also patches the no-custom-fields gap for most query types.

**6. Timeline / chronicle view**
One of LK's 5 core surfaces and the biggest content gap. Build in order:
- World calendar definition (data model foundation)
- Date fields on Event entities
- Chronicle list view
- Visual timeline (`react-chrono`)
- Gantt view (custom CSS)
- Calendar grid (custom component — do NOT use FullCalendar)
Differentiators over LK: era/age bands, parallel character/faction tracks, fuzzy dates, prophecy lane.

**7. Konva map migration**
Rewrite MapViewer from DOM-based to `react-konva` (canvas). Feature-parity with current implementation. Foundation required before any advanced map work. Foundry VTT uses PixiJS (WebGL) but that's overkill for a prep/worldbuilding tool — Konva is the right call.

**8. Advanced map features**
Build after Konva migration. In order: Layers + Pin Grouping → Text Annotations → Region Drawing → Fog of War → Tokens. Fog of war is the headline — LK hasn't shipped it yet.

---

## Tier 4 — After discovery layer ships

- YouTube + audio embeds (images done in Tier 1, media follows)
- Community marketplace (needs discovery layer as foundation)
- Foundry VTT export (Journal Entries compendium, v1 — stat blocks deferred)
- Boards / whiteboards (evaluate after user feedback)

---

## Decisions logged

- Custom fields: not building ACF-style fields. Single Tiptap block is correct for prose-first worldbuilding. Semantic search alleviates the filtering gap.
- Markdown toggle: removed. Obsidian export is the portability story.
- Calendar library: do NOT use FullCalendar or react-big-calendar — both Gregorian-coupled. Build custom grid component.
- Icon library: `@iconify/react` with game-icons set. Namespaced `gi:` prefix.
- Spotlight package: `cmdk` via shadcn `Command` component.
- Map canvas: `react-konva` (not PixiJS — overkill for a prep tool, not a live VTT session runner).
- Foundry integration: data sync only (compendium export), not canvas/rendering.
