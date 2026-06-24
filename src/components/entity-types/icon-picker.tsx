"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ICON_PICKER_OPTIONS } from "@/lib/constants/icon-picker";

const ICON_MAP: Record<string, LucideIcon> = {
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

/** Renders a Lucide icon by name string. Falls back to an empty span for unknown names. */
export function DynamicIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent)
    return (
      <span
        className={className}
        style={{ width: size, height: size, display: "inline-block" }}
      />
    );
  return <IconComponent size={size} className={className} />;
}

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <ScrollArea className="h-48">
          <div className="grid grid-cols-7 gap-1 p-1">
            {ICON_PICKER_OPTIONS.map((iconName) => {
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  className={cn(
                    "flex items-center justify-center rounded p-1.5 transition-colors hover:bg-muted",
                    isSelected && "bg-muted ring-1 ring-ring"
                  )}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                >
                  <DynamicIcon name={iconName} size={16} />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
