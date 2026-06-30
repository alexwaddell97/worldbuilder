# Spotlight Search — UX & Architecture Research

Research from 2026-06-29 competitive review of LegendKeeper and comparable tools.

---

## UX Pattern

**Cmd+K global search**, macOS Spotlight style. Opens as a floating dialog over all content, closes on Escape or selection.

Key behaviours to match:
- Instant open — no loading state before the input is visible
- Results appear as the user types (debounced ~150ms)
- Results grouped by entity type: Entities / Maps / Writing
- Keyboard-navigable (arrow keys + Enter to select)
- Recent/pinned items shown when query is empty
- Navigate directly to the selected entity on confirm

---

## Package Decision

**Use `cmdk` via shadcn `Command` component.**

```
npx shadcn@latest add command
```

- Authored by the same person as shadcn — fits the design system perfectly
- Ships as `CommandDialog` (modal) + `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`
- Zero extra dependencies beyond what shadcn already uses

**Do not use:** kbar, ninja-keys, react-cmdk.

---

## Architecture

### Trigger

```tsx
// Global keyboard handler (layout level)
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(true)
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [])
```

### API Route

```
GET /api/worlds/[slug]/search?q=<query>
```

Returns results grouped by type. Merges keyword (FTS) and semantic (vector) results.

### Result Shape

```ts
type SearchResult = {
  id: string
  type: 'entity' | 'map' | 'writing'
  name: string
  excerpt?: string   // short content snippet for context
  href: string       // direct navigation URL
  entityTypeSlug?: string
  iconName?: string
}
```

---

## Search Strategy: Hybrid Keyword + Semantic

Two layers run in parallel — keyword for speed, semantic for natural language understanding.

### Layer 1 — Full-Text Search (Postgres FTS)

- Handles exact matches and prefix queries instantly
- No AI cost
- Postgres `tsvector` + `tsquery` on entity name and content body
- Enable with a GIN index: `CREATE INDEX ... USING gin(to_tsvector('english', ...))`

### Layer 2 — Semantic / Vector Search (pgvector)

- Handles natural language queries: "who rules the northern kingdom", "characters who betrayed someone", "elven rangers"
- This **alleviates the lack of custom fields** — prose-rich content + semantic search is more powerful than structured filtering for most worldbuilding queries
- Results ranked by cosine similarity

#### Embedding implementation:

1. Enable `pgvector` extension on Neon (one migration — Neon supports it natively)
2. Add `embedding vector(1536)` column to the `entities` table
3. Embed `entity.name + entity.content` async on save (non-blocking background job)
4. Use `text-embedding-3-small` via Vercel AI Gateway — cost is ~$0.00002/entity (negligible)
5. Search endpoint: run FTS + cosine similarity, merge results, deduplicate

### Merge Strategy

```
FTS results (top N)     → exact/prefix matches first
Vector results (top N)  → fallback / natural language tail
Deduplicate by id → unified ranked list
```

---

## Positioning Note

**The search is the feature — do not market it as "AI search."**

Embeddings are an implementation detail. Users experience fast, intelligent search that understands natural language; they don't need to know how it works. This is consistent with the project's "no AI generation" brand stance.

---

## Scope for V1

- `CommandDialog` opens on Cmd+K
- Searches entities only (maps and writing can follow)
- FTS only on first ship — vector search as a follow-up upgrade (infra is additive)
- Recent entities shown when query is empty (client-side from recent nav history)
