"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Lock, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWorldDialog } from "@/components/worlds/edit-world-dialog";
import { DeleteWorldDialog } from "@/components/worlds/delete-world-dialog";
import { PrivacyToggle } from "@/components/worlds/privacy-toggle";
import { blobDisplayUrl } from "@/lib/utils";
import type { World } from "@/lib/db/schema";

export function WorldCard({ world }: { world: World }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-sm transition-shadow">
        {/* Cover image — always rendered for consistent card height */}
        <div className="relative w-full h-32 bg-muted">
          {world.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobDisplayUrl(world.imageUrl)}
              alt={`${world.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/30 select-none">
                {world.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`/worlds/${world.slug}`}
                className="text-base font-semibold hover:underline underline-offset-4"
              >
                {world.name}
              </Link>
              <p
                className="font-mono text-sm text-muted-foreground"
                aria-label={`World URL: /worlds/${world.slug}`}
              >
                /worlds/{world.slug}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  aria-label={`World options for ${world.name}`}
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
          </div>

          {/* Description */}
          {world.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 mt-2">
              {world.description}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="outline" className="text-muted-foreground gap-1">
              {world.isPublic ? (
                <>
                  <Globe size={12} />
                  Public
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Private
                </>
              )}
            </Badge>
            <div className="flex-1" />
            <PrivacyToggle worldId={world.id} isPublic={world.isPublic} />
          </div>
        </CardContent>
      </Card>

      <EditWorldDialog world={world} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWorldDialog world={world} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
