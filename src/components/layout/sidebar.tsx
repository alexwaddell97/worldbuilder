"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { APP_NAME } from "@/config/app";
import { useUIStore } from "@/stores/use-ui-store";
import { signOut } from "@/lib/auth/client";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import type { EntityType } from "@/lib/db/schema";

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
  worldEntityTypes?: EntityType[];
}

export function Sidebar({ worldSlug, worldName, worldEntityTypes }: SidebarProps = {}) {
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
    <aside
      className={`
        h-full flex flex-col bg-background border-r border-border overflow-hidden
        transition-[width] duration-200 ease-in-out
        ${sidebarOpen ? "w-[240px]" : "w-[56px]"}
      `}
    >
      {/* Logo / wordmark */}
      <div className="h-14 flex items-center px-3 border-b border-border shrink-0">
        {sidebarOpen ? (
          <span className="text-sm font-semibold tracking-tight text-foreground truncate">
            {APP_NAME}
          </span>
        ) : null}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={`
                flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors
                ${
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* World entity type nav — shown only when worldEntityTypes are provided */}
        {worldEntityTypes && worldSlug && (
          <div className="mt-3 pt-3 border-t border-border">
            {sidebarOpen && (
              <p className="px-2 pb-1 text-sm font-semibold text-foreground truncate">
                {worldName}
              </p>
            )}
            {worldEntityTypes.map((type) => {
              const href = `/worlds/${worldSlug}/entities/${type.slug}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={type.id}
                  href={href}
                  title={!sidebarOpen ? type.name : undefined}
                  className={`
                    flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors
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
              );
            })}
            {sidebarOpen && (
              <>
                <div className="border-t border-border mt-2 mb-1" />
                <Link
                  href={`/worlds/${worldSlug}/entity-types`}
                  className={`
                    flex items-center gap-3 px-2 py-1.5 rounded-md text-xs transition-colors
                    ${pathname === `/worlds/${worldSlug}/entity-types`
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  Settings
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Sign out button */}
      <div className="px-2 pb-2">
        <button
          onClick={handleSignOut}
          title={!sidebarOpen ? "Sign out" : undefined}
          className="
            flex items-center gap-3 px-2 py-2 w-full rounded-md text-sm
            text-muted-foreground hover:text-destructive transition-colors
          "
        >
          <span className="shrink-0">
            <LogOut size={18} />
          </span>
          {sidebarOpen && <span>Sign out</span>}
        </button>
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
      </div>
    </aside>
  );
}
