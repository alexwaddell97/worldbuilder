"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { createMapPinAction, updateMapPinAction } from "@/lib/actions/maps";
import { ICON_PICKER_OPTIONS, DEFAULT_GAME_ICONS } from "@/lib/constants/icon-picker";
import { GAME_ICON_NAMES } from "@/lib/constants/game-icon-names";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { MapPinWithRefs } from "@/lib/db/queries/maps";
import type { Entity, EntityType, Map } from "@/lib/db/schema";

const PIN_COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Pink", value: "#ec4899" },
  { label: "White", value: "#ffffff" },
];

const NONE_VALUE = "__none__";

const PIN_SHAPES = [
  { value: "circle",  label: "Circle",  previewClass: "rounded-full" },
  { value: "shield",  label: "Shield",  previewClass: "rounded-none", previewStyle: { clipPath: "polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)" } as React.CSSProperties },
  { value: "square",  label: "Square",  previewClass: "rounded-md" },
  { value: "diamond", label: "Diamond", previewClass: "rounded-sm rotate-45" },
];

interface MapPinFloatingPanelProps {
  /** Screen coordinates relative to the map container */
  screenPos: { x: number; y: number };
  /** Map container dimensions for edge-clamping */
  containerSize: { w: number; h: number };
  pendingPosition?: { x: number; y: number } | null;
  existingPin?: MapPinWithRefs | null;
  mapId: string;
  allEntities: (Entity & { entityType: EntityType })[];
  allMaps: Map[];
  onSaved: () => void;
  onClose: () => void;
}

const PANEL_W = 256;
const PANEL_H = 400; // used for flip calculation
const OFFSET = 12;  // gap between cursor and panel edge

export function MapPinFloatingPanel({
  screenPos,
  containerSize,
  pendingPosition,
  existingPin,
  mapId,
  allEntities,
  allMaps,
  onSaved,
  onClose,
}: MapPinFloatingPanelProps) {
  const [entityId, setEntityId] = useState(existingPin?.entityId ?? NONE_VALUE);
  const [linkedMapId, setLinkedMapId] = useState(existingPin?.linkedMapId ?? NONE_VALUE);
  const [label, setLabel] = useState(existingPin?.label ?? "");
  const [icon, setIcon] = useState(existingPin?.icon ?? "map-pin");
  const [color, setColor] = useState(existingPin?.color ?? "#3b82f6");
  const [shape, setShape] = useState(existingPin?.shape ?? "circle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const iconResults = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    if (!q) return null;
    return GAME_ICON_NAMES.filter((n) => n.includes(q)).slice(0, 42).map((n) => `gi:${n}`);
  }, [iconSearch]);
  const selectOpenRef = useRef(false);

  // Reset form when existingPin changes
  useEffect(() => {
    setEntityId(existingPin?.entityId ?? NONE_VALUE);
    setLinkedMapId(existingPin?.linkedMapId ?? NONE_VALUE);
    setLabel(existingPin?.label ?? "");
    setIcon(existingPin?.icon ?? "map-pin");
    setColor(existingPin?.color ?? "#3b82f6");
    setShape(existingPin?.shape ?? "circle");
  }, [existingPin]);

  // Close on outside click — but ignore clicks while a Select dropdown is open
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (selectOpenRef.current) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        const inPortal = (e.target as Element)?.closest?.("[data-radix-popper-content-wrapper]");
        if (!inPortal) onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  // Flip horizontally when near the right edge
  const fitsRight = screenPos.x + OFFSET + PANEL_W < containerSize.w - 8;
  const rawX = fitsRight
    ? screenPos.x + OFFSET              // open to the right
    : screenPos.x - OFFSET - PANEL_W;   // open to the left

  // Flip vertically when near the bottom
  const fitsBelow = screenPos.y + OFFSET + PANEL_H < containerSize.h - 8;
  const rawY = fitsBelow
    ? screenPos.y + OFFSET              // open downward
    : screenPos.y - OFFSET - PANEL_H;   // open upward

  const clampedX = Math.max(8, Math.min(rawX, containerSize.w - PANEL_W - 8));
  const clampedY = Math.max(8, Math.min(rawY, containerSize.h - PANEL_H - 8));

  async function handleSave() {
    setPending(true);
    setError(null);

    const pinData = {
      entityId: entityId !== NONE_VALUE ? entityId : null,
      linkedMapId: linkedMapId !== NONE_VALUE ? linkedMapId : null,
      label: label.trim() || null,
      icon,
      color,
      shape,
    };

    const result = existingPin
      ? await updateMapPinAction(existingPin.id, pinData)
      : await createMapPinAction({ ...pinData, mapId, x: pendingPosition!.x, y: pendingPosition!.y });

    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    onSaved();
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-40 w-64 flex flex-col bg-background/90 backdrop-blur-md border border-border/60 rounded-xl shadow-xl overflow-hidden"
      style={{ left: clampedX, top: clampedY, maxHeight: Math.min(PANEL_H, containerSize.h - clampedY - 8) }}
      // Prevent clicks from propagating to the map (would trigger another pin)
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/50">
        <span className="text-xs font-semibold text-foreground">
          {existingPin ? "Edit pin" : "Add pin"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={12} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-3 py-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50">
        {/* Entity link */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Link to entity
          </Label>
          <Select
            value={entityId}
            onOpenChange={(open) => { selectOpenRef.current = open; }}
            onValueChange={(v) => {
              setEntityId(v);
              if (v !== NONE_VALUE) setLinkedMapId(NONE_VALUE);
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {allEntities.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="flex items-center gap-1.5">
                    <DynamicIcon name={e.entityType.icon ?? "tag"} size={11} className="text-muted-foreground shrink-0" />
                    {e.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Linked map */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Drill into map
          </Label>
          <Select
            value={linkedMapId}
            onOpenChange={(open) => { selectOpenRef.current = open; }}
            onValueChange={(v) => {
              setLinkedMapId(v);
              if (v !== NONE_VALUE) setEntityId(NONE_VALUE);
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {allMaps.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Label */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Label
          </Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional…"
            maxLength={80}
            className="h-7 text-xs md:text-xs"
          />
        </div>

        {/* Icon picker */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Icon
          </Label>
          <div className="relative">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search icons…"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="w-full h-7 rounded-md border border-input bg-background pl-5 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-7 gap-0.5 max-h-24 overflow-y-auto p-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {(iconResults ?? [...new Set([...ICON_PICKER_OPTIONS, ...DEFAULT_GAME_ICONS])]).map((name) => (
              <button
                key={name}
                type="button"
                title={name.startsWith("gi:") ? name.slice(3).replace(/-/g, " ") : name}
                onClick={() => setIcon(name)}
                className={cn(
                  "h-6 w-full flex items-center justify-center rounded transition-colors cursor-pointer",
                  icon === name
                    ? "bg-primary/15 ring-1 ring-primary/50"
                    : "hover:bg-muted"
                )}
              >
                <DynamicIcon name={name} size={12} />
              </button>
            ))}
            {iconResults?.length === 0 && (
              <p className="col-span-7 py-2 text-center text-[10px] text-muted-foreground">No icons found</p>
            )}
          </div>
        </div>

        {/* Shape picker */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Shape
          </Label>
          <div className="flex gap-1.5">
            {PIN_SHAPES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.label}
                onClick={() => setShape(s.value)}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded border-2 transition-colors cursor-pointer",
                  shape === s.value ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
                )}
              >
                <div
                  className={cn("h-4 w-4 bg-foreground/70", s.previewClass)}
                  style={s.previewStyle}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Colour */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Colour
          </Label>
          <div className="flex gap-1.5 overflow-x-hidden py-0.5 px-0.5">
            {PIN_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-transform cursor-pointer",
                  color === c.value
                    ? "border-foreground scale-110"
                    : c.value === "#ffffff"
                    ? "border-muted-foreground/40 hover:scale-105"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : existingPin ? "Save" : "Add pin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
