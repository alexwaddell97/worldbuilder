"use client";

import { useState } from "react";
import { Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditWorldDialog } from "@/components/worlds/edit-world-dialog";
import { DeleteWorldDialog } from "@/components/worlds/delete-world-dialog";
import type { World } from "@/lib/db/schema";

export function WorldDetailActions({ world }: { world: World }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/worlds/${world.slug}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${world.slug}-export.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[export]", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={14} className="mr-1.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil size={14} className="mr-1.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={14} className="mr-1.5" />
          Delete
        </Button>
      </div>

      <EditWorldDialog world={world} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWorldDialog world={world} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
