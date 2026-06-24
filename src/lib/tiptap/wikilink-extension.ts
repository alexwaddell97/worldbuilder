"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { Suggestion } from "@tiptap/suggestion";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { WikilinkNodeView } from "@/components/tiptap/wikilink-node";

export type WikilinkAttrs = { id: string; label: string; dead: boolean };

// Markdown serializer/parser registered in TiptapEditor via Markdown.configure({ extensions })

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
    return ReactNodeViewRenderer(WikilinkNodeView);
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "[[",
        items: async () => [],
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
        render: () => ({}),
      }),
    ];
  },
});
