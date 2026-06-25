"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EntityListFiltersProps {
  worldSlug: string;
  typeSlug: string;
  typeName: string;
  currentSearch?: string;
  currentTag?: string;
  availableTags: string[];
}

export function EntityListFilters({
  worldSlug,
  typeSlug,
  typeName,
  currentSearch,
  currentTag,
  availableTags,
}: EntityListFiltersProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch ?? "");
  const baseUrl = `/worlds/${worldSlug}/entities/${typeSlug}`;

  function buildUrl(q?: string, tag?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  const pushSearch = useCallback(
    (value: string) => {
      router.push(buildUrl(value || undefined, currentTag));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, currentTag, baseUrl]
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchValue(value);
    const timer = setTimeout(() => pushSearch(value), 300);
    return () => clearTimeout(timer);
  }

  function selectTag(tag: string) {
    router.push(buildUrl(searchValue || undefined, tag));
  }

  function clearTag() {
    router.push(buildUrl(searchValue || undefined, undefined));
  }

  // Always render — search should be available even when no tags exist
  // if (availableTags.length === 0 && !currentSearch && !currentTag) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          className="pl-9"
          placeholder={`Search ${typeName}…`}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      {availableTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tag size={14} />
              {currentTag ? (
                <>
                  Tag: {currentTag}
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearTag();
                    }}
                    className="ml-1 hover:text-foreground text-muted-foreground cursor-pointer"
                  >
                    <X size={12} />
                  </span>
                </>
              ) : (
                "Filter by tag"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className={
                    currentTag === tag ? "ring-1 ring-ring rounded-full" : ""
                  }
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
