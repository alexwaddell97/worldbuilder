"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";

interface AutocompleteItem {
  id: string;
  name: string;
  slug: string;
}

interface WikilinkAutocompleteProps {
  items: AutocompleteItem[];
  command: (item: { id: string; name: string }) => void;
  selectedIndex: number;
}

export interface WikilinkAutocompleteHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const WikilinkAutocomplete = forwardRef<
  WikilinkAutocompleteHandle,
  WikilinkAutocompleteProps
>(({ items, command, selectedIndex: initialSelectedIndex }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);

  useImperativeHandle(ref, () => ({
    onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) command({ id: item.id, name: item.name });
        return true;
      }
      if (event.key === "Escape") {
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="absolute z-50 min-w-50 rounded-md border bg-popover shadow-md overflow-hidden">
      {items.map((item, index) => (
        <button
          key={item.id}
          className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
          }`}
          onClick={() => command({ id: item.id, name: item.name })}
          type="button"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
});

WikilinkAutocomplete.displayName = "WikilinkAutocomplete";
