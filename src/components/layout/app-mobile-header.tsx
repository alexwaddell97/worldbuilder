"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Home,
  Map,
  Network,
  BookOpen,
  UserCircle,
  LogOut,
  Layers,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { WorldAvatar } from "@/components/ui/world-avatar";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { signOut } from "@/lib/auth/client";
import type { EntityType, World } from "@/lib/db/schema";

interface AppMobileHeaderProps {
  worlds?: World[];
  worldSlug?: string;
  worldName?: string;
  worldImageUrl?: string | null;
  worldEntityTypes?: EntityType[];
}

export function AppMobileHeader({
  worlds,
  worldSlug,
  worldName,
  worldImageUrl,
  worldEntityTypes,
}: AppMobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  }

  function navLink(href: string, icon: React.ReactNode, label: string, exact = false) {
    const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
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
          <span className="truncate">{label}</span>
        </Link>
      </SheetClose>
    );
  }

  const inWorldContext = !!worldSlug && !!worldEntityTypes;
  const headerTitle = inWorldContext ? worldName : "Subcreation";

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
          <div className="h-14 flex items-end gap-2 px-4 pb-2.5 border-b border-border shrink-0">
            <AppWordmark />
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none mb-0.5">
              Alpha
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            {inWorldContext ? (
              <>
                {/* Dashboard — always first, same as desktop */}
                <div className="space-y-0.5">
                  {navLink("/dashboard", <Home size={16} />, "Dashboard", true)}
                </div>

                {/* World-specific nav */}
                <div className="pt-2 mt-2 border-t border-border">
                  <SheetClose asChild>
                    <Link
                      href={`/worlds/${worldSlug}`}
                      className={`
                        flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors mb-0.5
                        ${pathname === `/worlds/${worldSlug}`
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                      `}
                    >
                      <WorldAvatar name={worldName ?? ""} imageUrl={worldImageUrl} size={18} />
                      <span className="font-medium truncate">{worldName}</span>
                    </Link>
                  </SheetClose>
                  <div className="space-y-0.5">
                    {navLink(`/worlds/${worldSlug}/maps`, <Map size={16} />, "Maps")}
                    {navLink(`/worlds/${worldSlug}/relationships`, <Network size={16} />, "Relationships")}
                    {navLink(`/worlds/${worldSlug}/writing`, <BookOpen size={16} />, "Writing")}
                  </div>
                </div>

                {worldEntityTypes.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-border space-y-0.5">
                    {worldEntityTypes.map((et) =>
                      navLink(
                        `/worlds/${worldSlug}/entities/${et.slug}`,
                        <DynamicIcon name={et.icon ?? ""} size={16} />,
                        et.namePlural ?? et.name
                      )
                    )}
                  </div>
                )}

                <div className="pt-1 mt-1 border-t border-border">
                  {navLink(
                    `/worlds/${worldSlug}/entity-types`,
                    <Layers size={16} />,
                    "Entity Types",
                    true
                  )}
                </div>
              </>
            ) : (
              <>
                {navLink("/dashboard", <Home size={18} />, "Dashboard", true)}

                {worlds && worlds.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-border space-y-0.5">
                    {worlds.map((world) =>
                      navLink(
                        `/worlds/${world.slug}`,
                        <WorldAvatar name={world.name} imageUrl={world.imageUrl} size={18} />,
                        world.name
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Bottom: Account + Sign out */}
          <div className="px-2 pb-3 pt-2 border-t border-border space-y-0.5 shrink-0">
            <SheetClose asChild>
              <Link
                href="/settings"
                className={`
                  flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors
                  ${pathname === "/settings" || pathname.startsWith("/settings/")
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <span className="shrink-0"><UserCircle size={18} /></span>
                <span>Account</span>
              </Link>
            </SheetClose>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 h-10 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <span className="shrink-0"><LogOut size={18} /></span>
              <span>Sign out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Context title */}
      <div className="flex-1 flex items-center justify-center gap-2 px-2">
        {inWorldContext && (
          <WorldAvatar name={worldName ?? ""} imageUrl={worldImageUrl} size={18} />
        )}
        <span className="text-sm font-medium truncate">{headerTitle}</span>
      </div>
    </header>
  );
}
