"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { APP_COPYRIGHT_YEAR } from "@/config/app";
import { useState, useEffect } from "react";

type Currency = "USD" | "GBP";

const PRICES: Record<Currency, { symbol: string; monthly: string | null }> = {
  USD: { symbol: "$", monthly: "8" },
  GBP: { symbol: "£", monthly: "6" },
};

function detectCurrency(): Currency {
  if (typeof navigator === "undefined") return "USD";
  const lang = navigator.language ?? "";
  return lang.includes("GB") || lang.includes("gb") ? "GBP" : "USD";
}

const tiers = [
  {
    name: "Scribe",
    pricingKey: null as null,
    priceDetail: "forever",
    description: "Everything you need to start building your first world.",
    cta: "Start for free",
    ctaHref: "/signup",
    highlighted: false,
    badge: null as string | null,
    features: [
      "1 world",
      "Up to 100 entities",
      "Custom entity types",
      "Rich text editor",
      "Wikilinks between entities",
      "Obsidian export",
    ],
  },
  {
    name: "Loremaster",
    pricingKey: "monthly" as const,
    priceDetail: "per month",
    description: "For worldbuilders who are serious about their craft.",
    cta: "Start building",
    ctaHref: "/signup",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Unlimited worlds",
      "Unlimited entities",
      "Custom entity types",
      "Rich text editor",
      "Wikilinks between entities",
      "Obsidian export",
      "Interactive maps",
      "Collaborators",
      "AI features (coming soon)",
      "Priority support",
    ],
  },
  {
    name: "Codex",
    pricingKey: null as null,
    priceDetail: "forever",
    description:
      "Run Sub-creation locally as a desktop app. Your files, your machine, no subscription.",
    cta: "Join the waitlist",
    ctaHref: "/signup",
    highlighted: false,
    badge: "Coming soon",
    features: [
      "Everything in Loremaster",
      "Local file storage",
      "No internet required",
      "Desktop app (Electron)",
      "No subscription, ever",
    ],
  },
];

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  const { symbol } = PRICES[currency];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="py-24 text-center max-w-2xl mx-auto px-6 w-full">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Simple, honest pricing
        </h1>
        <p className="text-lg text-muted-foreground mt-4">
          Start free. Upgrade when your world demands it. Or self-host and pay
          nothing, ever.
        </p>
      </section>

      {/* Tier cards */}
      <section className="pb-24 max-w-5xl mx-auto px-6 w-full">
        {/* Currency toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1 text-sm">
            {(["USD", "GBP"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1 rounded transition-colors ${
                  currency === c
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "USD" ? "$ USD" : "£ GBP"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const price =
              tier.pricingKey
                ? `${symbol}${PRICES[currency][tier.pricingKey]}`
                : "Free";

            const isCodex = tier.name === "Codex";

            return (
              <div
                key={tier.name}
                className={`relative rounded-lg border p-8 flex flex-col gap-6 h-full ${
                  isCodex
                    ? "bg-muted border-dashed border-border"
                    : tier.highlighted
                    ? "bg-card border-foreground shadow-sm"
                    : "bg-card border-border"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1 rounded-full bg-background border border-border text-muted-foreground whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {tier.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {tier.priceDetail}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <Link
                  href={tier.ctaHref}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90 ${
                    isCodex
                      ? "bg-secondary text-foreground border border-border"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight size={14} />
                </Link>

                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-foreground"
                      />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All plans include Obsidian export — your data is always yours.{" "}
          <Link
            href="/#data-ownership"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Learn more about data ownership →
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        © {APP_COPYRIGHT_YEAR} Sub-creation
      </footer>
    </div>
  );
}
