"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Map as MapIcon } from "lucide-react";
import { blobDisplayUrl } from "@/lib/utils";
import type { MapTreeNode } from "@/lib/db/queries/maps";

interface MapTreeProps {
  nodes: MapTreeNode[];
  basePath: string;
}

function SubMapRow({ node, basePath, depth }: { node: MapTreeNode; basePath: string; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className="border-t border-border">
      <div className="flex items-center group" style={{ paddingLeft: 16 + depth * 16 }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 p-1 text-muted-foreground transition-colors ${hasChildren ? "hover:text-foreground" : "invisible pointer-events-none"}`}
        >
          <ChevronDown size={11} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} />
        </button>
        <Link
          href={`${basePath}/${node.slug}`}
          className="flex items-center gap-2.5 flex-1 min-w-0 py-2.5 pr-4 hover:bg-muted/40 transition-colors"
        >
          <div className="shrink-0 w-7 h-7 rounded overflow-hidden bg-muted flex items-center justify-center">
            {node.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={blobDisplayUrl(node.imageUrl)} alt={node.name} className="w-full h-full object-cover" />
            ) : (
              <MapIcon size={12} strokeWidth={1.5} className="text-muted-foreground/50" />
            )}
          </div>
          <span className="text-sm text-foreground group-hover:underline underline-offset-4 truncate">{node.name}</span>
          {hasChildren && (
            <span className="text-xs text-muted-foreground shrink-0 ml-auto pl-2">
              {node.children.length} {node.children.length === 1 ? "sub-map" : "sub-maps"}
            </span>
          )}
        </Link>
      </div>
      {hasChildren && expanded && node.children.map((child) => (
        <SubMapRow key={child.id} node={child} basePath={basePath} depth={depth + 1} />
      ))}
    </div>
  );
}

function MapCard({ node, basePath }: { node: MapTreeNode; basePath: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className={`border border-border bg-card hover:shadow-sm transition-shadow relative ${hasChildren && expanded ? "rounded-t-xl" : "rounded-xl"}`}>
      {/* Image */}
      <Link href={`${basePath}/${node.slug}`} className="block group overflow-hidden rounded-t-xl">
        <div className="relative h-36 bg-muted flex items-center justify-center">
          {node.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobDisplayUrl(node.imageUrl)}
              alt={node.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <MapIcon size={32} strokeWidth={1} className="text-muted-foreground/40" />
          )}
        </div>
        <div className="px-4 pt-3 pb-3">
          <p className="text-sm font-medium group-hover:underline underline-offset-4 truncate">{node.name}</p>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{node.description}</p>
          )}
        </div>
      </Link>

      {/* Sub-maps */}
      {hasChildren && (
        <div className="border-t border-border relative">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`flex items-center justify-between w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ${expanded ? "" : "rounded-b-xl"}`}
          >
            <span>{node.children.length} {node.children.length === 1 ? "sub-map" : "sub-maps"}</span>
            <ChevronDown size={12} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} />
          </button>
          {expanded && (
            <div className="absolute top-full left-[-1px] right-[-1px] z-20 border border-t-0 border-border rounded-b-xl bg-card shadow-lg overflow-y-auto max-h-[200px] scrollbar-sidebar">
              {node.children.map((child) => (
                <SubMapRow key={child.id} node={child} basePath={basePath} depth={0} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MapTree({ nodes, basePath }: MapTreeProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      {nodes.map((node) => (
        <MapCard key={node.id} node={node} basePath={basePath} />
      ))}
    </div>
  );
}
