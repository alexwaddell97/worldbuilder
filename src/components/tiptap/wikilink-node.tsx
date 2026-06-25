"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { cn } from "@/lib/utils";

type WikilinkAttrs = { id: string; label: string; dead: boolean };

type WikilinkNodeViewProps = NodeViewProps & {
  onWikilinkClick?: (entityId: string) => void;
};

export const WikilinkNodeView: React.FC<WikilinkNodeViewProps> = ({ node, selected, onWikilinkClick }) => {
  const attrs = node.attrs as WikilinkAttrs;
  const isDead = attrs.dead || !attrs.id;

  function handleClick() {
    if (!isDead && attrs.id && onWikilinkClick) {
      onWikilinkClick(attrs.id);
    }
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium select-none",
          "ring-1 ring-inset transition-colors",
          isDead
            ? "bg-destructive/10 text-destructive ring-destructive/30 line-through cursor-default"
            : onWikilinkClick
              ? "bg-primary/10 text-primary ring-primary/20 hover:bg-primary/20 cursor-pointer"
              : "bg-primary/10 text-primary ring-primary/20 cursor-pointer",
          selected && "ring-2 ring-primary"
        )}
        data-wikilink-node
        contentEditable={false}
        onClick={handleClick}
      >
        {isDead && (
          <span aria-label="broken link" className="mr-0.5">
            ⚠
          </span>
        )}
        {attrs.label || attrs.id}
      </span>
    </NodeViewWrapper>
  );
};
