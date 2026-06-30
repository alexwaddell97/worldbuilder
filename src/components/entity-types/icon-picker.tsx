"use client";

import { useState, useMemo } from "react";
import {
  User,
  Users,
  UserRound,
  Crown,
  Shield,
  Sword,
  Wand,
  GraduationCap,
  MapPin,
  Map,
  Castle,
  Mountain,
  Trees,
  Building,
  Building2,
  Home,
  Warehouse,
  Tent,
  Package,
  Gem,
  Key,
  Scroll,
  Book,
  BookOpen,
  FlaskConical,
  Hammer,
  Swords,
  Wand2,
  Calendar,
  Clock,
  Zap,
  Flame,
  Sun,
  Moon,
  Star,
  Flag,
  Globe,
  Network,
  Layers,
  Tag,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Icon, addCollection } from "@iconify/react";
import type { IconifyJSON } from "@iconify/types";
import gameIconsMini from "@/lib/constants/game-icons-mini.json";
import { GAME_ICON_NAMES } from "@/lib/constants/game-icon-names";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ICON_PICKER_OPTIONS, DEFAULT_GAME_ICONS } from "@/lib/constants/icon-picker";

// Register our curated game-icons subset for offline, SSR-compatible rendering.
// Icons selected from search (not in this set) load from Iconify CDN.
addCollection(gameIconsMini as IconifyJSON);

// Lucide fallback map — kept for backward compatibility with existing entity types
// that were saved with Lucide icon names before the GI migration.
const LUCIDE_FALLBACK: Record<string, LucideIcon> = {
  user: User,
  users: Users,
  "user-round": UserRound,
  crown: Crown,
  shield: Shield,
  sword: Sword,
  wand: Wand,
  "graduation-cap": GraduationCap,
  "map-pin": MapPin,
  map: Map,
  castle: Castle,
  mountain: Mountain,
  trees: Trees,
  building: Building,
  "building-2": Building2,
  home: Home,
  warehouse: Warehouse,
  tent: Tent,
  package: Package,
  gem: Gem,
  key: Key,
  scroll: Scroll,
  book: Book,
  "book-open": BookOpen,
  "flask-conical": FlaskConical,
  hammer: Hammer,
  swords: Swords,
  "wand-2": Wand2,
  calendar: Calendar,
  clock: Clock,
  zap: Zap,
  flame: Flame,
  sun: Sun,
  moon: Moon,
  star: Star,
  flag: Flag,
  globe: Globe,
  network: Network,
  layers: Layers,
  tag: Tag,
};

/** Renders a game-icon (gi: prefix), a legacy Lucide icon, or an empty placeholder. */
export function DynamicIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  if (name?.startsWith("gi:")) {
    return (
      <Icon
        icon={`game-icons:${name.slice(3)}`}
        width={size}
        height={size}
        className={className}
      />
    );
  }
  const LucideComponent = LUCIDE_FALLBACK[name];
  if (LucideComponent) return <LucideComponent size={size} className={className} />;
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: "inline-block" }}
    />
  );
}

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const matches = GAME_ICON_NAMES.filter((n) => n.includes(q)).slice(0, 60);
    return matches.map((n) => `gi:${n}`);
  }, [search]);

  function handleSelect(iconName: string) {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSearch("");
  }

  function IconButton({ iconName }: { iconName: string }) {
    const isSelected = value === iconName;
    const label = iconName.startsWith("gi:")
      ? iconName.slice(3).replace(/-/g, " ")
      : iconName;
    return (
      <button
        type="button"
        title={label}
        className={cn(
          "flex items-center justify-center rounded p-1.5 transition-colors hover:bg-muted cursor-pointer",
          isSelected && "bg-muted ring-1 ring-ring"
        )}
        onClick={() => handleSelect(iconName)}
      >
        <DynamicIcon name={iconName} size={16} />
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-9 p-0"
          aria-label="Pick icon"
        >
          {value ? (
            <DynamicIcon name={value} size={18} />
          ) : (
            <span className="text-muted-foreground">?</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="relative mb-1.5">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search 4,000+ icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent pl-6 pr-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50" onWheel={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-7 gap-1 p-1">
            {searchResults ? (
              <>
                {searchResults.map((iconName) => (
                  <IconButton key={iconName} iconName={iconName} />
                ))}
                {searchResults.length === 0 && (
                  <p className="col-span-7 py-4 text-center text-xs text-muted-foreground">
                    No icons found
                  </p>
                )}
              </>
            ) : (
              <>
                {ICON_PICKER_OPTIONS.map((iconName) => (
                  <IconButton key={iconName} iconName={iconName} />
                ))}
                <div className="col-span-7 my-1 border-t border-border" />
                {DEFAULT_GAME_ICONS.map((iconName) => (
                  <IconButton key={iconName} iconName={iconName} />
                ))}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
