# 04-02 Summary: WikilinkExtension + WikilinkNodeView

## What Was Built

**`src/components/tiptap/wikilink-node.tsx`** — React NodeView component:
- Exports `WikilinkNodeView` typed as `React.FC<NodeViewProps>` (NodeViewProps from `@tiptap/core`)
- Uses `NodeViewWrapper as="span"` from `@tiptap/react` — not a plain div
- Renders pill with `bg-primary/10 text-primary` for live links
- Dead links (`dead=true`): `line-through`, `bg-destructive/10`, ⚠ indicator
- `contentEditable={false}` on inner span
- No `dangerouslySetInnerHTML` anywhere

**`src/lib/tiptap/wikilink-extension.ts`** — Tiptap Node extension:
- Exports `WikilinkExtension` (`Node.create`) and `WikilinkAttrs` type
- `name: "wikilink"`, `group: "inline"`, `inline: true`, `atom: true`, `selectable: true`
- Attrs: `{ id: null, label: "", dead: false }`
- `parseHTML`: parses `<span data-wikilink="true">` with `data-id`, `data-label`, `data-dead`
- `renderHTML`: emits `["span", mergeAttributes(...)]` — no hole (atom node)
- `addNodeView`: returns `ReactNodeViewRenderer(WikilinkNodeView)`
- `addProseMirrorPlugins`: returns Suggestion plugin stub (empty items + render)
- Comment in file noting markdown serialization is registered in TiptapEditor via `Markdown.configure({ extensions })`
- No `dangerouslySetInnerHTML`

## Verification

- `npx tsc --noEmit` exits 0 — zero TypeScript errors
- `WikilinkExtension` and `WikilinkAttrs` both exported
- `atom: true` and `inline: true` present
- `renderHTML` produces `["span", attrs]` — no third element / no hole
- `contentEditable={false}` in NodeView
