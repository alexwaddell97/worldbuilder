"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Map, FileText, Link2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { useUIStore } from "@/stores/use-ui-store";
import type { UnifiedSearchResult } from "@/lib/db/queries/search";

function SnippetRow({ result, query }: { result: UnifiedSearchResult; query: string }) {
  if (!result.snippet) return null;
  return (
    <div className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
      {result.snippetField === "relationship" && (
        <Link2 size={10} className="shrink-0 opacity-60" />
      )}
      <span className="truncate">
        <HighlightMatch text={result.snippet} query={query} />
      </span>
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-foreground font-semibold bg-primary/15 rounded-[3px] px-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface SearchCommandProps {
  searchApiUrl: string;
  entityBasePath: string;
  /** path segment for writing docs — "writing" for private, "stories" for public */
  writingPath?: string;
}

export function SearchCommand({
  searchApiUrl,
  entityBasePath,
  writingPath = "writing",
}: SearchCommandProps) {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [listHeight, setListHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const wasLoadingRef = useRef(false);
  const router = useRouter();

  // Cmd+K / Ctrl+K global trigger
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  // Reset when closed
  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
      setListHeight(0);
      wasLoadingRef.current = false;
    }
  }, [searchOpen]);

  // Fetch with debounce + abort
  const fetchResults = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const controller = new AbortController();
      fetch(`${searchApiUrl}?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: UnifiedSearchResult[]) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setLoading(false);
        });
      return () => controller.abort();
    },
    [searchApiUrl]
  );

  useEffect(() => {
    const cleanup = fetchResults(query);
    return cleanup;
  }, [query, fetchResults]);

  // Update height only when loading finishes, or query is cleared
  useEffect(() => {
    if (!query.trim()) {
      setListHeight(0);
      wasLoadingRef.current = false;
      return;
    }
    if (loading) {
      wasLoadingRef.current = true;
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setListHeight(contentRef.current.offsetHeight);
        }
      });
    }
  }, [loading, query]);

  // Group entities by type; maps and writing are their own sections
  const entityGroups = results
    .filter((r): r is UnifiedSearchResult & { kind: "entity" } => r.kind === "entity")
    .reduce<Record<string, (UnifiedSearchResult & { kind: "entity" })[]>>((acc, r) => {
      const key = r.entityTypeName ?? "Entities";
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

  const mapResults = results.filter((r) => r.kind === "map");
  const writingResults = results.filter((r) => r.kind === "writing");

  function hrefFor(r: UnifiedSearchResult): string {
    if (r.kind === "entity")
      return `${entityBasePath}/entities/${r.entityTypeSlug}/${r.slug}`;
    if (r.kind === "map") return `${entityBasePath}/maps/${r.slug}`;
    return `${entityBasePath}/${writingPath}/${r.slug}`;
  }

  function handleSelect(r: UnifiedSearchResult) {
    setSearchOpen(false);
    router.push(hrefFor(r));
  }

  const hasResults = results.length > 0;

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            placeholder="Search entities, maps, stories..."
            value={query}
            onValueChange={setQuery}
          />
          <motion.div
            animate={{ height: listHeight }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div ref={contentRef} className="pb-1.5">
              <CommandList className="max-h-[280px] scrollbar-sidebar">
                {!loading && query.trim() && !hasResults && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}

                {/* Entity type groups */}
                {Object.entries(entityGroups).map(([typeName, items]) => (
                  <CommandGroup key={typeName} heading={typeName}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex items-start gap-2"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-7 h-7 rounded object-cover shrink-0 bg-muted"
                          />
                        ) : item.entityTypeIcon ? (
                          <DynamicIcon
                            name={item.entityTypeIcon}
                            size={14}
                            className="text-muted-foreground shrink-0 mt-0.5"
                          />
                        ) : <span className="w-3.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{item.name}</div>
                          <SnippetRow result={item} query={query} />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}

                {/* Maps */}
                {mapResults.length > 0 && (
                  <CommandGroup heading="Maps">
                    {mapResults.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex items-start gap-2"
                      >
                        <Map size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{item.name}</div>
                          <SnippetRow result={item} query={query} />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Writing / Stories */}
                {writingResults.length > 0 && (
                  <CommandGroup heading="Stories">
                    {writingResults.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex items-start gap-2"
                      >
                        <FileText size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{item.name}</div>
                          <SnippetRow result={item} query={query} />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </div>
          </motion.div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
