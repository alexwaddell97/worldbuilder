# Worldbuilder

## What This Is

A beautiful, Apple-clean worldbuilding platform for fiction authors and TTRPG game masters. Users create rich, interconnected worlds — characters, locations, factions, events, and custom entity types — using a markdown-first editor with a toggle between rich (Tiptap) and raw markdown modes. Worlds are cloud-hosted with full portable export (markdown + YAML frontmatter, Obsidian-compatible). A public discovery layer lets builders share their worlds with readers and publish updates like a newsletter.

## Core Value

A builder's world data belongs to them and never disappears — beautiful to use, fully portable on exit, never held hostage by lock-in or algorithmic noise.

## Requirements

### Validated

- [x] Builders can create and manage worlds with custom entity types (characters, locations, factions, events + user-defined) — *Phases 2–3*
- [x] Content editor supports both rich (Tiptap) and raw markdown modes, togglable per-builder preference — *Phase 4*
- [x] Entities link to each other via a visual relationship graph (nodes + typed edges) — *Phase 5*
- [x] Full world export as Obsidian-compatible markdown (YAML frontmatter, [[wikilinks]], all assets) — *Phase 6*
- [x] No AI generation, no ads, no lock-in — stated principles enforced at the product level — *core constraint upheld*
- [x] Interactive maps with pinned entities, hierarchical nesting, public viewer — *Phase 7 (shipped beyond original scope)*
- [x] Long-form writing (documents + projects) with word tracking and publish toggle — *Phase 8 (shipped beyond original scope)*
- [x] Public read-only world access (Explorer level) — entities, maps, stories, graph — *partial Milestone 2 shipped*

### Active

- [ ] Three-tier access model: Builder (owns/edits), Player (interacts within revealed scope), Explorer (anonymous read-only) — Explorer is live; Player role not yet built
- [ ] Builders control what Players see — spoiler/reveal system hides lore until explicitly unlocked
- [ ] Public world discovery: browse/search page for published worlds + builder-authored newsletter updates and short stories

### Out of Scope

- Foundry VTT integration — deferred to future milestone
- Real-time collaboration (multi-cursor editing) — scope risk, defer to v2
- Mobile native app — web-first
- AI-assisted content generation — explicit non-feature (core value)
- Monetization / billing — not decided, out of v1 scope

## Context

- Stack decided: Next.js (App Router), Tailwind CSS, shadcn/ui, Tiptap (rich + markdown editor)
- Obsidian-compatible export means: markdown files with YAML frontmatter, [[wikilink]] syntax for entity references, preserving folder structure
- Target aesthetic: Apple-clean — high whitespace, minimal chrome, typography-first, zero visual noise
- Two equal primary user personas:
  1. **Fiction authors** — solo worldbuilders writing novel/story universes, may keep world private or share publicly
  2. **TTRPG Game Masters** — campaign world builders who reveal lore to players progressively
- The Player role exists specifically for TTRPG use: players join a world, see what the GM has revealed, may add session notes or character data
- Discovery layer is closer to a portfolio/showcase (browse + follow) than a marketplace — no curation gatekeeping
- "No lock-in" is a promise: export must be a first-class, always-available feature — not buried in settings

## Constraints

- **Tech Stack**: Next.js + Tailwind + shadcn/ui + Tiptap — decided before project start
- **Philosophy**: No ads, no AI generation, no algorithmic feeds — these are hard product constraints, not soft preferences
- **Export fidelity**: Obsidian-compatible export must round-trip cleanly — entity wikilinks must resolve in Obsidian without manual cleanup

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tiptap as editor | Supports both rich and raw markdown, ProseMirror-based, extensible, Yjs-ready for future collab | — Pending |
| Cloud-hosted with full export | SaaS convenience + data ownership guarantee — not self-hosted | — Pending |
| Builder/Player/Explorer roles (not RBAC) | Domain-native language fits the actual user mental model better than generic roles | — Pending |
| Foundry VTT integration deferred | High complexity relative to v1 value; not a blocker for core platform | — Pending |
| No monetization in v1 | Business model undecided; don't let it constrain architecture choices now | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-29 — reconciled against live codebase after Milestone 1 completion*
