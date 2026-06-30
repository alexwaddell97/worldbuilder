"use client";

import { useRef, useState, useEffect } from "react";
import { version } from "../../../package.json";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Search,
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
    icon: <DynamicIcon name="gi:compass" size={18} />,
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
  const { sidebarOpen, toggleSidebar, setSearchOpen } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  const navRef = useRef<HTMLElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  function checkNavScroll() {
    const el = navRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }

  useEffect(() => {
    checkNavScroll();
  }, [worldEntityTypes, worlds]);

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
        h-full hidden md:flex flex-col bg-background border-r border-border overflow-hidden
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
      <div className="relative flex-1 min-h-0">
      <nav ref={navRef} onScroll={checkNavScroll} className="h-full overflow-y-auto scrollbar-sidebar py-2 px-2 space-y-0.5">
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
          <div className="mt-3 pt-3 border-t border-border space-y-0.5">
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
          <div className="mt-3 pt-3 border-t border-border space-y-0.5">
            {/* Search */}
            <NavTooltip label="Search (⌘K)" collapsed={!sidebarOpen}>
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <span className="shrink-0"><Search size={16} /></span>
                {sidebarOpen && (
                  <>
                    <span className="truncate flex-1 text-left">Search</span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">⌘K</span>
                  </>
                )}
              </button>
            </NavTooltip>
            {/* World home */}
            <NavTooltip label={worldName ?? "World"} collapsed={!sidebarOpen}>
              <Link
                href={`/worlds/${worldSlug}`}
                className={`
                  flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
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
                    <span className="shrink-0"><DynamicIcon name="gi:treasure-map" size={16} /></span>
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
                    <span className="shrink-0"><DynamicIcon name="gi:family-tree" size={16} /></span>
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
                    <span className="shrink-0"><DynamicIcon name="gi:quill" size={16} /></span>
                    {sidebarOpen && <span className="truncate">Writing</span>}
                  </Link>
                </NavTooltip>
              );
            })()}

            {worldEntityTypes.length > 0 && (
              <div className="space-y-0.5">
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
              </div>
            )}
            <NavTooltip label="Entity Types" collapsed={!sidebarOpen}>
              <Link
                href={`/worlds/${worldSlug}/entity-types`}
                className={`
                  flex items-center gap-3 pl-2.75 pr-2 h-9 rounded-md text-sm transition-colors
                  ${pathname === `/worlds/${worldSlug}/entity-types`
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <span className="shrink-0"><DynamicIcon name="gi:book-pile" size={16} /></span>
                {sidebarOpen && <span>Entity Types</span>}
              </Link>
            </NavTooltip>
          </div>
        )}
      </nav>
      {canScrollDown && (
        <button
          onClick={() => navRef.current?.scrollBy({ top: 144, behavior: "smooth" })}
          className="absolute bottom-0 left-0 right-0 h-7 bg-linear-to-t from-background to-transparent flex items-end justify-center pb-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer w-full"
        >
          <ChevronDown size={16} />
        </button>
      )}
      </div>

      {/* Bottom nav: Settings + Sign out */}
      <div className="px-2 pb-2 pt-2 space-y-0.5 shrink-0 border-t border-border">
        <NavTooltip label="Account" collapsed={!sidebarOpen}>
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
            <span className="shrink-0"><DynamicIcon name="gi:portrait" size={18} /></span>
            {sidebarOpen && <span className="truncate">Account</span>}
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
      <div className="px-2 pb-3 border-t border-border pt-2 shrink-0">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="flex items-center justify-center w-full py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted cursor-pointer"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-1">v{version}</p>
      </div>
    </aside>
    </TooltipProvider>
  );
}
