"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { signOut } from "@/lib/auth/client";

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

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
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
            Odin&apos;s Archive
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
