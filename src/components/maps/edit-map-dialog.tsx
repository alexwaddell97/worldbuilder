"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapImageUpload } from "@/components/ui/map-image-upload";
import { updateMapAction } from "@/lib/actions/maps";
import { useRouter } from "next/navigation";
import type { Map } from "@/lib/db/schema";

interface EditMapDialogProps {
  map: Map;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMapDialog({ map, open, onOpenChange }: EditMapDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRootMap, setIsRootMap] = useState(map.isRootMap);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await updateMapAction(map.id, {
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
      imageUrl: (fd.get("imageUrl") as string) || undefined,
      isRootMap,
    });

    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit map</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Map image</Label>
            <MapImageUpload name="imageUrl" currentUrl={map.imageUrl} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-map-name">Name</Label>
            <Input
              id="edit-map-name"
              name="name"
              defaultValue={map.name}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-map-desc">Description</Label>
            <Textarea
              id="edit-map-desc"
              name="description"
              defaultValue={map.description ?? ""}
              maxLength={500}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Show in maps index</p>
              <p className="text-xs text-muted-foreground">Uncheck for sub-maps only accessible via pins</p>
            </div>
            <Switch checked={isRootMap} onCheckedChange={setIsRootMap} />
          </div>
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
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
