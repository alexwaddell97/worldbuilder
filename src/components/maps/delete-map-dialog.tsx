"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMapAction } from "@/lib/actions/maps";
import { useRouter } from "next/navigation";
import type { Map } from "@/lib/db/schema";

interface DeleteMapDialogProps {
  map: Map;
  worldSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMapDialog({
  map,
  worldSlug,
  open,
  onOpenChange,
}: DeleteMapDialogProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    const result = await deleteMapAction(map.id);
    setPending(false);

    if (result.success) {
      onOpenChange(false);
      router.push(`/worlds/${worldSlug}/maps`);
      router.refresh();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{map.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the map and all its pins. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 size={14} className="mr-2" />
            {pending ? "Deleting…" : "Delete map"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
