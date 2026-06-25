"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditMapDialog } from "@/components/maps/edit-map-dialog";
import { DeleteMapDialog } from "@/components/maps/delete-map-dialog";
import type { Map } from "@/lib/db/schema";

interface MapDetailActionsProps {
  map: Map;
  worldSlug: string;
}

export function MapDetailActions({ map, worldSlug }: MapDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Map options"
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMapDialog map={map} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteMapDialog
        map={map}
        worldSlug={worldSlug}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
