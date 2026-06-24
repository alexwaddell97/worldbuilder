"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { deleteEntityTypeAction } from "@/lib/actions/entity-types";
import type { EntityType } from "@/lib/db/schema";

interface DeleteEntityTypeDialogProps {
  entityType: EntityType;
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEntityTypeDialog({
  entityType,
  worldId,
  open,
  onOpenChange,
}: DeleteEntityTypeDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteEntityTypeAction(entityType.id, worldId);
      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType.name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            This action cannot be undone. {entityType.name} will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive px-1">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
