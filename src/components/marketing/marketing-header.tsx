"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoLink } from "./logo-link";
import { AnchorNavLink } from "./anchor-nav-link";
import { MarketingMobileNav } from "./marketing-mobile-nav";

export function MarketingHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;
  const navLinkClass = `hidden md:block text-sm transition-colors hover:text-foreground ${
    transparent ? "text-foreground/60" : "text-muted-foreground"
  }`;

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-10 transition-all duration-300",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/40 backdrop-blur-sm border-b border-border",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LogoLink />
        </div>
        <nav className="flex items-center gap-4 md:gap-6">
          <AnchorNavLink
            href="/#features"
            anchor="features"
            className={navLinkClass}
          >
            Features
          </AnchorNavLink>
          <AnchorNavLink
            href="/#data-ownership"
            anchor="data-ownership"
            className={navLinkClass}
          >
            Data ownership
          </AnchorNavLink>
          <Link
            href="/pricing"
            className={navLinkClass}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className={navLinkClass}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Sign up
          </Link>
          <MarketingMobileNav />
        </nav>
      </div>
    </header>
  );
}
