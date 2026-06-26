"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
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
      "Unlimited custom entity types",
      "Custom fields per entity type",
      "1 interactive map with pins",
      "500MB image storage",
      "Rich text editor with wikilinks",
      "Relationship graph explorer",
      "Writing workspace",
      "Session & document word goals",
      "Distraction-free focus mode",
      "Markdown export",
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
      "Unlimited custom entity types",
      "Custom fields per entity type",
      "Unlimited interactive maps with pins",
      "Unlimited image storage",
      "Rich text editor with wikilinks",
      "Relationship graph explorer",
      "Writing workspace with projects",
      "Session & document word goals",
      "Distraction-free focus mode",
      "Markdown export",
      "Priority support",
    ],
  },
  {
    name: "Codex",
    pricingKey: null as null,
    priceDetail: "forever",
    description:
      "Run Subcreation locally as a desktop app. Your files, your machine, no subscription.",
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
      <section className="py-24 text-center max-w-2xl mx-auto px-4 sm:px-6 w-full">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Simple, honest pricing
        </h1>
        <p className="text-lg text-muted-foreground mt-4">
          Start free. Upgrade when your world demands it. Or self-host and pay
          nothing, ever.
        </p>
      </section>

      {/* Tier cards */}
      <section className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 w-full">
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
                  <ChevronRight size={14} />
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
          All plans include Markdown export. Your data is always yours.{" "}
          <Link
            href="/#data-ownership"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Learn more about data ownership <ChevronRight size={12} className="inline" />
          </Link>
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="pb-24 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <h2 className="text-xl font-semibold text-center text-foreground mb-8">
          Compare plans
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm min-w-140">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 font-medium text-muted-foreground w-1/2">Feature</th>
                <th className="text-center px-4 py-4 font-medium text-muted-foreground">Scribe</th>
                <th className="text-center px-4 py-4 font-medium text-foreground">Loremaster</th>
                <th className="text-center px-4 py-4 font-medium text-muted-foreground">Codex</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Worlds", scribe: "1", loremaster: "Unlimited", codex: "Unlimited" },
                { label: "Entities", scribe: "Up to 100", loremaster: "Unlimited", codex: "Unlimited" },
                { label: "Custom entity types", scribe: true, loremaster: true, codex: true },
                { label: "Custom fields per entity type", scribe: true, loremaster: true, codex: true },
                { label: "Interactive maps", scribe: "1", loremaster: "Unlimited", codex: "Unlimited" },
                { label: "Map pins linked to entities", scribe: true, loremaster: true, codex: true },
                { label: "Image storage", scribe: "500MB", loremaster: "Unlimited", codex: "Local" },
                { label: "Rich text editor", scribe: true, loremaster: true, codex: true },
                { label: "Wikilinks between entities", scribe: true, loremaster: true, codex: true },
                { label: "Relationship graph explorer", scribe: true, loremaster: true, codex: true },
                { label: "Writing workspace", scribe: true, loremaster: true, codex: true },
                { label: "Writing projects & documents", scribe: true, loremaster: true, codex: true },
                { label: "Session & document word goals", scribe: true, loremaster: true, codex: true },
                { label: "Distraction-free focus mode", scribe: true, loremaster: true, codex: true },
                { label: "Markdown export", scribe: true, loremaster: true, codex: true },
                { label: "Two-factor authentication", scribe: true, loremaster: true, codex: true },
                { label: "Priority support", scribe: false, loremaster: true, codex: true },
                { label: "Local / offline storage", scribe: false, loremaster: false, codex: true },
                { label: "No subscription required", scribe: true, loremaster: false, codex: true },
              ].map((row, i) => (
                <tr key={row.label} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                  {([row.scribe, row.loremaster, row.codex] as (boolean | string)[]).map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center">
                      {typeof val === "boolean" ? (
                        val
                          ? <Check size={15} className="inline text-foreground" />
                          : <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className={j === 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
