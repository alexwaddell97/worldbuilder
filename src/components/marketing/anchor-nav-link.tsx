"use client";

import { usePathname } from "next/navigation";

interface AnchorNavLinkProps {
  href: string;
  anchor: string;
  className?: string;
  children: React.ReactNode;
}

export function AnchorNavLink({ href, anchor, className, children }: AnchorNavLinkProps) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
