# 04-03 Summary: TiptapEditor + WikilinkAutocomplete + Entity Detail Page

## What Was Built

**`src/components/tiptap/wikilink-autocomplete.tsx`** — Suggestion dropdown:
- Exports `WikilinkAutocomplete` as a `forwardRef` component with `WikilinkAutocompleteHandle` ref type
- Props: `{ items, command, selectedIndex }`
- Keyboard: ArrowUp/Down moves selection, Enter invokes command, Escape closes
- Renders `null` when `items.length === 0`
- No `dangerouslySetInnerHTML`

**`src/components/tiptap/tiptap-editor.tsx`** — Main editor component:
- Exports `TiptapEditor` with props `{ entityId, worldId, worldSlug, initialContent }`
- `useEditor` with `StarterKit`, `Markdown`, `WikilinkExtension.configure({ suggestion: {...} })`
- Auto-saves via `onBlur` (immediate) and `onUpdate` (2-second debounce with `clearTimeout`)
- `saveEntityContentAction` called for both save paths with ownership verification on server
- `[[` triggers Suggestion plugin → fetches `/api/worlds/${worldSlug}/entities/autocomplete?q=...`
- Autocomplete dropdown rendered via `createPortal` into `document.body`, positioned with `fixed` style from `props.clientRect()`
- Markdown toggle: `editor.getMarkdown()` (extension-added method) captures current markdown; `editor.storage.markdown.manager.parse()` converts back to JSON
- Save status indicator: "Saving…" / "Saved" / "Error saving" in toolbar

**`src/app/(worlds)/worlds/[slug]/entities/[type-slug]/[entity-slug]/page.tsx`** — Page update:
- Imports `TiptapEditor`
- Replaced placeholder `<div>` with `<TiptapEditor entityId={entity.id} worldId={world.id} worldSlug={slug} initialContent={entity.content} />`

**`src/lib/tiptap/wikilink-extension.ts`** — Updated:
- Added `parseMarkdown`, `renderMarkdown`, `markdownTokenizer` directly on the `Node.create` config
- `@tiptap/markdown` `MarkdownManager` auto-discovers these via `getExtensionField` — no manual registration needed
- Tokenizer parses `[[label|id]]` syntax as inline token; serializer emits `[[label|id]]`

## Key Discovery
`@tiptap/extension-markdown` (v2 package name) doesn't exist in v3. The correct package is `@tiptap/markdown`. The `Markdown.configure({ extensions: [...] })` API described in the plan doesn't exist — custom node markdown specs are defined directly on the node extension config and auto-discovered by `MarkdownManager`.

## Verification

- `npx tsc --noEmit` exits 0 — zero TypeScript errors
- `npm run build` passes — all 11 routes compile
- No `dangerouslySetInnerHTML` in any new file
- `saveEntityContentAction` called in both `onBlur` and debounce paths
- `clearTimeout(saveTimeoutRef.current)` called before each new timeout
- Autocomplete URL uses `encodeURIComponent(query)`
