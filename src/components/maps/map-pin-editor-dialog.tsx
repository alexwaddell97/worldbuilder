"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { MapPinWithRefs, MapWithPins } from "@/lib/db/queries/maps";
import type { Entity, EntityType, Map } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

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

interface MapPinEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide when creating a new pin */
  pendingPosition?: { x: number; y: number } | null;
  /** Provide when editing an existing pin */
  existingPin?: MapPinWithRefs | null;
  mapId: string;
  /** All entities in this world for the dropdown */
  allEntities: (Entity & { entityType: EntityType })[];
  /** All maps in this world for the link-to-map dropdown */
  allMaps: Map[];
  onSaved: () => void;
}

const NONE_VALUE = "__none__";

export function MapPinEditorDialog({
  open,
  onOpenChange,
  pendingPosition,
  existingPin,
  mapId,
  allEntities,
  allMaps,
  onSaved,
}: MapPinEditorDialogProps) {
  const [entityId, setEntityId] = useState<string>(NONE_VALUE);
  const [linkedMapId, setLinkedMapId] = useState<string>(NONE_VALUE);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("map-pin");
  const [color, setColor] = useState("#3b82f6");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing an existing pin
  useEffect(() => {
    if (existingPin) {
      setEntityId(existingPin.entityId ?? NONE_VALUE);
      setLinkedMapId(existingPin.linkedMapId ?? NONE_VALUE);
      setLabel(existingPin.label ?? "");
      setIcon(existingPin.icon ?? "map-pin");
      setColor(existingPin.color ?? "#3b82f6");
    } else {
      setEntityId(NONE_VALUE);
      setLinkedMapId(NONE_VALUE);
      setLabel("");
      setIcon("map-pin");
      setColor("#3b82f6");
    }
  }, [existingPin, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const pinData = {
      entityId: entityId !== NONE_VALUE ? entityId : null,
      linkedMapId: linkedMapId !== NONE_VALUE ? linkedMapId : null,
      label: label.trim() || null,
      icon,
      color,
    };

    let result: { success: boolean; error?: string };

    if (existingPin) {
      result = await updateMapPinAction(existingPin.id, pinData);
    } else {
      result = await createMapPinAction({
        ...pinData,
        mapId,
        x: pendingPosition!.x,
        y: pendingPosition!.y,
      });
    }

    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existingPin ? "Edit pin" : "Add pin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Entity link */}
          <div className="space-y-1.5">
            <Label>Link to entity</Label>
            <Select
              value={entityId}
              onValueChange={(v) => {
                setEntityId(v);
                if (v !== NONE_VALUE) setLinkedMapId(NONE_VALUE);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {allEntities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <DynamicIcon
                        name={e.entityType.icon ?? "tag"}
                        size={12}
                        className="text-muted-foreground shrink-0"
                      />
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked map */}
          <div className="space-y-1.5">
            <Label>Drill into map</Label>
            <Select
              value={linkedMapId}
              onValueChange={(v) => {
                setLinkedMapId(v);
                if (v !== NONE_VALUE) setEntityId(NONE_VALUE);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {allMaps.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label override */}
          <div className="space-y-1.5">
            <Label htmlFor="pin-label">Label (optional)</Label>
            <Input
              id="pin-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Custom label…"
              maxLength={80}
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_PICKER_OPTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setIcon(name)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded border transition-colors",
                    icon === name
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  <DynamicIcon name={name} size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex gap-2 flex-wrap">
              {PIN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : existingPin ? "Save changes" : "Add pin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
