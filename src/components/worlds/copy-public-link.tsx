"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyPublicLinkProps {
  publicSlug: string;
}

export function CopyPublicLink({ publicSlug }: CopyPublicLinkProps) {
  const [copied, setCopied] = useState(false);

  const displayUrl = `/w/${publicSlug}`;

  function handleCopy() {
    const fullUrl = `${window.location.origin}/w/${publicSlug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy public link"}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      {copied ? (
        <Check size={13} className="text-green-600 shrink-0" />
      ) : (
        <Link2 size={13} className="shrink-0" />
      )}
      <span className="font-mono group-hover:underline underline-offset-2">
        {copied ? "Copied!" : displayUrl}
      </span>
    </button>
  );
}
