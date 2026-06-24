"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WorldForm } from "@/components/worlds/world-form";
import { createWorldAction } from "@/lib/actions/worlds";

export function CreateWorldDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          Create World
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new world</DialogTitle>
          <DialogDescription>
            Give your world a name. A URL slug is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <WorldForm
          action={createWorldAction}
          submitLabel="Create World"
          pendingLabel="Creating..."
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
