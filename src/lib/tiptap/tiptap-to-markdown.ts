// Server-safe Tiptap JSON → Markdown converter.
// No editor instance required — pure tree traversal.

type Mark = { type: string; attrs?: Record<string, unknown> };

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Mark[];
  text?: string;
};

function convertInline(node: TiptapNode): string {
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "wikilink") {
    const label = (node.attrs?.label as string) ?? "";
    return `[[${label}]]`;
  }
  if (node.type !== "text") return "";

  let text = node.text ?? "";
  const marks = node.marks ?? [];

  // Apply marks — order matters for nesting
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        text = `**${text}**`;
        break;
      case "italic":
        text = `*${text}*`;
        break;
      case "code":
        text = `\`${text}\``;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "#";
        text = `[${text}](${href})`;
        break;
      }
    }
  }

  return text;
}

function convertListItem(node: TiptapNode, indent = 0): string {
  return (node.content ?? [])
    .map((child) => convertNode(child, indent))
    .join("\n");
}

function convertNode(node: TiptapNode, indent = 0): string {
  const pad = " ".repeat(indent);

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => convertNode(n)).join("\n\n").trim();

    case "paragraph": {
      const text = (node.content ?? []).map(convertInline).join("");
      return text;
    }

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const text = (node.content ?? []).map(convertInline).join("");
      return `${"#".repeat(level)} ${text}`;
    }

    case "bulletList":
      return (node.content ?? [])
        .map((li) => `${pad}- ${convertListItem(li, indent + 2)}`)
        .join("\n");

    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => `${pad}${i + 1}. ${convertListItem(li, indent + 3)}`)
        .join("\n");

    case "listItem":
      return convertListItem(node, indent);

    case "blockquote":
      return (node.content ?? [])
        .map((n) => `> ${convertNode(n)}`)
        .join("\n");

    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "horizontalRule":
      return "---";

    default:
      return (node.content ?? []).map((n) => convertNode(n)).join("\n\n");
  }
}

export function tiptapToMarkdown(doc: unknown): string {
  if (!doc) return "";
  try {
    return convertNode(doc as TiptapNode);
  } catch {
    return "";
  }
}
