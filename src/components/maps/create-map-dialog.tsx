"use client";

import { useState } from "react";
import { Map as MapIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapImageUpload } from "@/components/ui/map-image-upload";
import { createMapAction } from "@/lib/actions/maps";
import { useRouter } from "next/navigation";
import type { Map } from "@/lib/db/schema";

interface CreateMapDialogProps {
  worldId: string;
  worldSlug: string;
  allMaps?: Map[];
  /** When provided the dialog is fully controlled externally — no trigger button is rendered */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateMapDialog({ worldId, worldSlug, allMaps = [], open: controlledOpen, onOpenChange }: CreateMapDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(value: boolean) {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  }
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentMapId, setParentMapId] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createMapAction(worldId, {
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
      imageUrl: (fd.get("imageUrl") as string) || undefined,
      parentMapId: parentMapId || null,
    });

    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    setOpen(false);
    router.push(`/worlds/${worldSlug}/maps/${result.slug}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <MapIcon size={16} />
            New Map
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create map</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Map image</Label>
            <MapImageUpload name="imageUrl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="map-name">Name</Label>
            <Input
              id="map-name"
              name="name"
              placeholder="e.g. World Map"
              required
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="map-desc">Description</Label>
            <Textarea
              id="map-desc"
              name="description"
              placeholder="Optional notes about this map"
              maxLength={500}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {allMaps.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent map <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={parentMapId ?? "none"} onValueChange={(v) => setParentMapId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None (root map)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root map)</SelectItem>
                  {allMaps.filter((m) => {
                    if (!m.parentMapId) return true; // root — ok
                    const parent = allMaps.find((p) => p.id === m.parentMapId);
                    return !parent?.parentMapId; // depth-1 — ok; depth-2 — excluded
                  }).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create map"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
