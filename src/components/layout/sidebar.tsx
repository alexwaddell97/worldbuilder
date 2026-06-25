"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Map,
  Settings,
  Layers,
  Network,
  BookOpen,
} from "lucide-react";
import { APP_NAME } from "@/config/app";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { AppIcon } from "@/components/ui/app-icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WorldAvatar } from "@/components/ui/world-avatar";
import { useUIStore } from "@/stores/use-ui-store";
import { signOut } from "@/lib/auth/client";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import type { EntityType, World } from "@/lib/db/schema";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home size={18} />,
  },
];

interface SidebarProps {
  worldSlug?: string;
  worldName?: string;
  worldImageUrl?: string | null;
  worldEntityTypes?: EntityType[];
  worlds?: World[];
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

export function Sidebar({ worldSlug, worldName, worldImageUrl, worldEntityTypes, worlds }: SidebarProps = {}) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error("[sidebar] signOut error:", err);
    } finally {
      // Always navigate to login — session state is cleared client-side
      // regardless of whether the server-side invalidation succeeded.
      router.push("/login");
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
    <aside
      className={`
        h-full flex flex-col bg-background border-r border-border overflow-hidden
        transition-[width] duration-200 ease-in-out
        ${sidebarOpen ? "w-60" : "w-14"}
      `}
    >
      {/* Logo / wordmark */}
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

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavTooltip key={item.href} label={item.label} collapsed={!sidebarOpen}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                  ${
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            </NavTooltip>
          );
        })}

        {/* Worlds list */}
        {worlds && worlds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            {worlds.map((world) => {
              const href = `/worlds/${world.slug}`;
              const isActive = pathname.startsWith(href);
              return (
                <NavTooltip key={world.id} label={world.name} collapsed={!sidebarOpen}>
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
                    <span className="shrink-0">
                      <WorldAvatar name={world.name} imageUrl={world.imageUrl} size={18} />
                    </span>
                    {sidebarOpen && <span className="truncate">{world.name}</span>}
                  </Link>
                </NavTooltip>
              );
            })}
          </div>
        )}

        {/* World entity type nav — shown only when worldEntityTypes are provided */}
        {worldEntityTypes && worldSlug && (
          <div className="mt-3 pt-3 border-t border-border">
            {/* World home */}
            <NavTooltip label={worldName ?? "World"} collapsed={!sidebarOpen}>
              <Link
                href={`/worlds/${worldSlug}`}
                className={`
                  flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors mb-1
                  ${pathname === `/worlds/${worldSlug}`
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <span className="shrink-0">
                  <WorldAvatar name={worldName ?? ""} imageUrl={worldImageUrl} size={18} />
                </span>
                {sidebarOpen && <span className="truncate font-medium">{worldName}</span>}
              </Link>
            </NavTooltip>
            {/* Maps link */}
            {(() => {
              const mapsHref = `/worlds/${worldSlug}/maps`;
              const mapsActive = pathname.startsWith(mapsHref);
              return (
                <NavTooltip label="Maps" collapsed={!sidebarOpen}>
                  <Link
                    href={mapsHref}
                    className={`
                      flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                      ${mapsActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <span className="shrink-0"><Map size={16} /></span>
                    {sidebarOpen && <span className="truncate">Maps</span>}
                  </Link>
                </NavTooltip>
              );
            })()}

            {/* Relationships link */}
            {(() => {
              const relHref = `/worlds/${worldSlug}/relationships`;
              const relActive = pathname.startsWith(relHref);
              return (
                <NavTooltip label="Relationships" collapsed={!sidebarOpen}>
                  <Link
                    href={relHref}
                    className={`
                      flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                      ${relActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <span className="shrink-0"><Network size={16} /></span>
                    {sidebarOpen && <span className="truncate">Relationships</span>}
                  </Link>
                </NavTooltip>
              );
            })()}

            {/* Writing link */}
            {(() => {
              const writingHref = `/worlds/${worldSlug}/writing`;
              const writingActive = pathname.startsWith(writingHref);
              return (
                <NavTooltip label="Writing" collapsed={!sidebarOpen}>
                  <Link
                    href={writingHref}
                    className={`
                      flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                      ${writingActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <span className="shrink-0"><BookOpen size={16} /></span>
                    {sidebarOpen && <span className="truncate">Writing</span>}
                  </Link>
                </NavTooltip>
              );
            })()}

            {worldEntityTypes.map((type) => {
              const href = `/worlds/${worldSlug}/entities/${type.slug}`;
              const isActive = pathname.startsWith(href);
              return (
                <NavTooltip key={type.id} label={type.name} collapsed={!sidebarOpen}>
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
                    <span className="shrink-0">
                      <DynamicIcon name={type.icon ?? ""} size={16} />
                    </span>
                    {sidebarOpen && <span className="truncate">{type.name}</span>}
                  </Link>
                </NavTooltip>
              );
            })}
            <div className="border-t border-border mt-2 mb-1" />
            <NavTooltip label="Entity Types" collapsed={!sidebarOpen}>
              <Link
                href={`/worlds/${worldSlug}/entity-types`}
                className={`
                  flex items-center gap-3 pl-2.75 pr-2 h-8 rounded-md text-xs transition-colors
                  ${pathname === `/worlds/${worldSlug}/entity-types`
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <span className="shrink-0"><Layers size={16} /></span>
                {sidebarOpen && <span>Entity Types</span>}
              </Link>
            </NavTooltip>
          </div>
        )}
      </nav>

      {/* Bottom nav: Settings + Sign out */}
      <div className="px-2 pb-2 space-y-0.5">
        <NavTooltip label="Settings" collapsed={!sidebarOpen}>
          <Link
            href="/settings"
            className={`
              flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
              ${pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            <span className="shrink-0"><Settings size={18} /></span>
            {sidebarOpen && <span className="truncate">Settings</span>}
          </Link>
        </NavTooltip>
        <NavTooltip label="Sign out" collapsed={!sidebarOpen}>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 pl-2.75 pr-2 h-9 w-full rounded-md text-sm cursor-pointer
              text-muted-foreground hover:text-destructive transition-colors`}
          >
            <span className="shrink-0"><LogOut size={18} /></span>
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </NavTooltip>
      </div>

      {/* Collapse toggle */}
      <div className="px-2 pb-3 border-t border-border pt-2">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="flex items-center justify-center w-full py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-1">v0.1.0</p>
      </div>
    </aside>
    </TooltipProvider>
  );
}
