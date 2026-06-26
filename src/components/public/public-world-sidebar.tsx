"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Network, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { WorldAvatar } from "@/components/ui/world-avatar";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { AppIcon } from "@/components/ui/app-icon";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/use-ui-store";
import type { EntityType } from "@/lib/db/schema";

interface PublicWorldSidebarProps {
  worldSlug: string;
  worldName: string;
  worldImageUrl?: string | null;
  entityTypes: EntityType[];
}

function NavTooltip({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PublicWorldSidebar({
  worldSlug,
  worldName,
  worldImageUrl,
  entityTypes,
}: PublicWorldSidebarProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const base = `/w/${worldSlug}`;

  function navLink(href: string, icon: React.ReactNode, label: string) {
    const isActive = pathname === href || (href !== base && pathname.startsWith(href));
    return (
      <NavTooltip key={href} label={label} collapsed={!sidebarOpen}>
        <Link
          href={href}
          className={`
            flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
            ${isActive
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
        >
          <span className="shrink-0">{icon}</span>
          {sidebarOpen && <span className="truncate">{label}</span>}
        </Link>
      </NavTooltip>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={`
          h-full flex flex-col bg-background border-r border-border overflow-hidden shrink-0
          transition-[width] duration-200 ease-in-out
          ${sidebarOpen ? "w-60" : "w-14"}
        `}
      >
        {/* Wordmark */}
        <div className="h-14 flex items-end justify-between pl-4 pr-3 pb-2.5 border-b border-border shrink-0 overflow-hidden">
          <div className="flex items-end gap-2">
            {sidebarOpen ? <AppWordmark /> : <AppIcon size={24} />}
            {sidebarOpen && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none shrink-0 mb-0.5">
                Alpha
              </span>
            )}
          </div>
        </div>

        {/* World home */}
        <div className="px-2 pt-3 pb-2">
          <NavTooltip label={worldName} collapsed={!sidebarOpen}>
            <Link
              href={base}
              className={`
                flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                ${pathname === base
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <span className="shrink-0">
                <WorldAvatar name={worldName} imageUrl={worldImageUrl} size={18} />
              </span>
              {sidebarOpen && <span className="truncate font-medium">{worldName}</span>}
            </Link>
          </NavTooltip>
        </div>

        {/* Main nav */}
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

        {/* Bottom: sign in CTA */}
        {sidebarOpen && (
          <div className="px-3 pb-3 pt-2 border-t border-border space-y-1.5">
            <Link
              href="/signup"
              className="flex items-center justify-center w-full h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Start building free
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center w-full h-8 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="px-2 pb-3 border-t border-border pt-2">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="flex items-center justify-center w-full py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
