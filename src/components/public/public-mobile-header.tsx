"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Map, Network, BookOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { WorldAvatar } from "@/components/ui/world-avatar";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import type { EntityType } from "@/lib/db/schema";

interface PublicMobileHeaderProps {
  worldSlug: string;
  worldName: string;
  worldImageUrl?: string | null;
  entityTypes: EntityType[];
}

export function PublicMobileHeader({
  worldSlug,
  worldName,
  worldImageUrl,
  entityTypes,
}: PublicMobileHeaderProps) {
  const pathname = usePathname();
  const base = `/w/${worldSlug}`;

  function navLink(href: string, icon: React.ReactNode, label: string) {
    const isActive = pathname === href || (href !== base && pathname.startsWith(href));
    return (
      <SheetClose asChild key={href}>
        <Link
          href={href}
          className={`
            flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors
            ${isActive
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
        >
          <span className="shrink-0">{icon}</span>
          <span>{label}</span>
        </Link>
      </SheetClose>
    );
  }

  return (
    <header className="flex md:hidden items-center h-14 px-4 border-b border-border bg-background shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="p-0 w-72 flex flex-col">
          {/* Wordmark */}
          <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
            <AppWordmark />
          </div>

          {/* World home */}
          <div className="px-2 pt-3 pb-2">
            <SheetClose asChild>
              <Link
                href={base}
                className={`
                  flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors
                  ${pathname === base
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <WorldAvatar name={worldName} imageUrl={worldImageUrl} size={18} />
                <span className="font-medium truncate">{worldName}</span>
              </Link>
            </SheetClose>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
            <div className="space-y-0.5">
              {navLink(`${base}/maps`, <Map size={16} />, "Maps")}
              {navLink(`${base}/relationships`, <Network size={16} />, "Relationships")}
              {navLink(`${base}/stories`, <BookOpen size={16} />, "Stories")}
            </div>

            {entityTypes.length > 0 && (
              <div className="pt-2 mt-2 border-t border-border space-y-0.5">
                {entityTypes.map((et) =>
                  navLink(
                    `${base}/entities/${et.slug}`,
                    <DynamicIcon name={et.icon ?? ""} size={16} />,
                    et.namePlural ?? et.name
                  )
                )}
              </div>
            )}
          </nav>

          {/* CTAs */}
          <div className="px-3 pb-4 pt-3 border-t border-border space-y-1.5 shrink-0">
            <Link
              href="/signup"
              className="flex items-center justify-center w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Start building free
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center w-full h-9 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* World name */}
      <div className="flex-1 flex items-center justify-center gap-2 px-2">
        <WorldAvatar name={worldName} imageUrl={worldImageUrl} size={18} />
        <span className="text-sm font-medium truncate">{worldName}</span>
      </div>
    </header>
  );
}
