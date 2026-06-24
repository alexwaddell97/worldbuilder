"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { cn } from "@/lib/utils";

type WikilinkAttrs = { id: string; label: string; dead: boolean };

export const WikilinkNodeView: React.FC<NodeViewProps> = ({ node, selected }) => {
  const attrs = node.attrs as WikilinkAttrs;

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer select-none",
          "ring-1 ring-inset transition-colors",
          attrs.dead
            ? "bg-destructive/10 text-destructive ring-destructive/30 line-through"
            : "bg-primary/10 text-primary ring-primary/20 hover:bg-primary/20",
          selected && "ring-2 ring-primary"
        )}
        data-wikilink-node
        contentEditable={false}
      >
        {attrs.dead && (
          <span aria-label="broken link" className="mr-0.5">
            ⚠
          </span>
        )}
        {attrs.label || attrs.id}
      </span>
    </NodeViewWrapper>
  );
};
