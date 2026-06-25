"use client";

import { useEffect, useRef, useState } from "react";
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
import { ICON_PICKER_OPTIONS } from "@/lib/constants/icon-picker";
import { cn } from "@/lib/utils";
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
const PANEL_H = 420; // used for flip calculation
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconsExpanded, setIconsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset form when existingPin changes
  useEffect(() => {
    setEntityId(existingPin?.entityId ?? NONE_VALUE);
    setLinkedMapId(existingPin?.linkedMapId ?? NONE_VALUE);
    setLabel(existingPin?.label ?? "");
    setIcon(existingPin?.icon ?? "map-pin");
    setColor(existingPin?.color ?? "#3b82f6");
  }, [existingPin]);

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
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
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            className="h-7 text-xs"
          />
        </div>

        {/* Icon grid */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Icon
            </Label>
            <button
              type="button"
              onClick={() => setIconsExpanded((v) => !v)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {iconsExpanded ? "Show less" : "Show all"}
            </button>
          </div>
          {/* Selected icon preview + collapsed first row */}
          <div
            className={cn(
              "flex flex-wrap gap-1 overflow-hidden transition-all",
              iconsExpanded ? "max-h-none" : "max-h-13"
            )}
          >
            {ICON_PICKER_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => setIcon(name)}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded border transition-colors",
                  icon === name
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                <DynamicIcon name={name} size={12} />
              </button>
            ))}
          </div>
          {!iconsExpanded && !(ICON_PICKER_OPTIONS as readonly string[]).slice(0, 16).includes(icon) && (
            <p className="text-[10px] text-muted-foreground">
              Selected: <span className="font-medium">{icon}</span> — click &ldquo;Show all&rdquo; to change
            </p>
          )}
        </div>

        {/* Colour */}
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Colour
          </Label>
          <div className="flex gap-1.5 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {PIN_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-transform",
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
