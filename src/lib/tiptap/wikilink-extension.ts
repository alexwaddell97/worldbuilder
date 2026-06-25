"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { Suggestion } from "@tiptap/suggestion";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { WikilinkNodeView } from "@/components/tiptap/wikilink-node";

export type WikilinkAttrs = { id: string; label: string; dead: boolean };

export const WikilinkExtension = Node.create({
  name: "wikilink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: "" },
      dead: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wikilink="true"]',
        getAttrs: (el) => ({
          id: (el as HTMLElement).getAttribute("data-id"),
          label: (el as HTMLElement).getAttribute("data-label"),
          dead: (el as HTMLElement).getAttribute("data-dead") === "true",
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "span",
      mergeAttributes({
        "data-wikilink": "true",
        "data-id": node.attrs.id,
        "data-label": node.attrs.label,
        "data-dead": String(node.attrs.dead ?? false),
      }),
    ];
  },

  addNodeView() {
    const { onWikilinkClick } = this.options;
    return ReactNodeViewRenderer(
      (props: Parameters<typeof WikilinkNodeView>[0]) =>
        WikilinkNodeView({ ...props, onWikilinkClick }),
    );
  },

  // Markdown serializer/parser registered here — picked up by @tiptap/markdown
  // via getExtensionField when the Markdown extension initialises the MarkdownManager.
  parseMarkdown(token: any, helpers: any) {
    return helpers.createNode("wikilink", {
      id: token.id,
      label: token.label,
      dead: false,
    });
  },

  renderMarkdown(node: any) {
    const id = node.attrs?.id;
    const label = node.attrs?.label || id;
    // Don't output [[|]] for wikilinks with missing attrs — it can't round-trip
    if (!id) return "";
    return `[[${label}|${id}]]`;
  },

  markdownTokenizer: {
    name: "wikilink",
    level: "inline" as const,
    start(src: string) {
      return src.indexOf("[[");
    },
    tokenize(src: string) {
      const openIdx = src.indexOf("[[");
      if (openIdx !== 0) return undefined;
      const closeIdx = src.indexOf("]]", 2);
      if (closeIdx === -1) return undefined;
      const inner = src.slice(2, closeIdx);
      const pipeIdx = inner.lastIndexOf("|");
      if (pipeIdx === -1) return undefined;
      const label = inner.slice(0, pipeIdx);
      const id = inner.slice(pipeIdx + 1);
      if (!label || !id) return undefined;
      return {
        type: "wikilink",
        raw: src.slice(0, closeIdx + 2),
        label,
        id,
        tokens: [],
      };
    },
  },

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        items: async () => [] as Array<{ id: string; name: string; slug: string }>,
        render: () => ({}),
      },
      onWikilinkClick: undefined as ((entityId: string) => void) | undefined,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "wikilink",
              attrs: { id: props.id, label: props.name, dead: false },
            })
            .run();
        },
      }),
    ];
  },
});
