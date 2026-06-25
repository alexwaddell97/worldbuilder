"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppWordmark } from "@/components/ui/app-wordmark";

export function LogoLink() {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link href="/" onClick={handleClick} className="flex items-end gap-2">
      <AppWordmark />
      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none mb-0.5">
        Alpha
      </span>
    </Link>
  );
}
