// Walks a Tiptap JSON tree and returns all non-dead wikilink target IDs.
export function extractWikilinks(content: unknown): string[] {
  if (!content || typeof content !== "object") return [];
  const node = content as Record<string, unknown>;
  const ids: string[] = [];

  if (node.type === "wikilink" && node.attrs && typeof node.attrs === "object") {
    const attrs = node.attrs as Record<string, unknown>;
    if (!attrs.dead && typeof attrs.id === "string") {
      ids.push(attrs.id);
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      ids.push(...extractWikilinks(child));
    }
  }

  return ids;
}
