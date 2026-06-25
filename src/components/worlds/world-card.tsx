"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Lock, Globe } from "lucide-react";
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

const AVATAR_COLORS = [
  { bg: "bg-blue-100",    text: "text-blue-800"    },
  { bg: "bg-amber-100",   text: "text-amber-800"   },
  { bg: "bg-emerald-100", text: "text-emerald-800" },
  { bg: "bg-violet-100",  text: "text-violet-800"  },
  { bg: "bg-rose-100",    text: "text-rose-800"    },
  { bg: "bg-cyan-100",    text: "text-cyan-800"    },
  { bg: "bg-orange-100",  text: "text-orange-800"  },
  { bg: "bg-teal-100",    text: "text-teal-800"    },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function WorldCard({ world }: { world: World }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const avatarColor = getAvatarColor(world.name);

  return (
    <>
      <div className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:shadow-lg hover:border-border transition-all duration-300">

        {/* Image area — full bleed with gradient overlays */}
        <Link href={`/worlds/${world.slug}`} className="block relative h-52 bg-muted overflow-hidden">
          {world.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobDisplayUrl(world.imageUrl)}
              alt={`${world.name} cover`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className={`h-full w-full flex items-center justify-center ${avatarColor.bg}`}>
              <span className={`text-7xl font-bold select-none opacity-30 ${avatarColor.text}`}>
                {world.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Top scrim — keeps menu button legible */}
          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/40 to-transparent pointer-events-none" />

          {/* Bottom scrim — title legibility */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* World name + slug */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
            <h2 className="text-base font-semibold text-white leading-snug">
              {world.name}
            </h2>
            <p className="text-[11px] text-white/55 font-mono mt-0.5">
              /worlds/{world.slug}
            </p>
          </div>

          {/* Privacy pill — top left */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
              {world.isPublic ? <Globe size={10} /> : <Lock size={10} />}
              {world.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </Link>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center gap-2 min-h-12">
          {world.description ? (
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
              {world.description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-1 shrink-0">
            <PrivacyToggle worldId={world.id} isPublic={world.isPublic} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`World options for ${world.name}`}
                >
                  <MoreHorizontal size={14} />
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
        </div>
      </div>

      <EditWorldDialog world={world} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWorldDialog world={world} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
