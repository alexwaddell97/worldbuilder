"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { AppWordmark } from "@/components/ui/app-wordmark";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#data-ownership", label: "Data ownership" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingMobileNav() {
  return (
    <div className="flex md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="p-0 w-72 flex flex-col">
          {/* Wordmark */}
          <div className="h-14 flex items-end gap-2 px-4 pb-2.5 border-b border-border shrink-0">
            <AppWordmark />
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none mb-0.5">
              Alpha
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            {links.map(({ href, label }) => (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className="flex items-center px-3 h-10 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          {/* CTAs */}
          <div className="px-3 pb-4 pt-3 border-t border-border space-y-1.5 shrink-0">
            <SheetClose asChild>
              <Link
                href="/signup"
                className="flex items-center justify-center w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Start building free
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/login"
                className="flex items-center justify-center w-full h-9 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Log in
              </Link>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
