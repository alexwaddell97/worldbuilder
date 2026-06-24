"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteWorldAction } from "@/lib/actions/worlds";
import type { World } from "@/lib/db/schema";

interface DeleteWorldDialogProps {
  world: World;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteWorldDialog({ world, open, onOpenChange }: DeleteWorldDialogProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteWorldAction(world.id);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete world?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{world.name}</strong> and all
            its content. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep world</AlertDialogCancel>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete world"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
