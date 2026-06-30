"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";

type Billing = "monthly" | "annual";

const PRICES = { symbol: "$", monthly: "8", annualMonthly: "6" };

const tiers = [
  {
    name: "Scribe",
    paid: false,
    description: "Your worlds are always here when you come back. View and export everything, free forever.",
    cta: null,
    ctaHref: null,
    highlighted: false,
    badge: null as string | null,
    features: [
      "View all your worlds & entities",
      "Relationship graph (read-only)",
      "Export to Markdown",
    ],
  },
  {
    name: "Loremaster",
    paid: true,
    description: "Everything you need to build, run, and share your world. Try it free for 14 days.",
    cta: "Start free trial",
    ctaHref: "/signup",
    highlighted: true,
    badge: "14-day free trial",
    features: [
      "Unlimited worlds & entities",
      "Custom entity types",
      "Interactive maps with pins",
      "Rich text editor with wikilinks",
      "Relationship graph explorer",
      "Spotlight search (Cmd+K)",
      "Writing workspace with projects",
      "Word goals & focus mode",
      "Image uploads",
      "Full world export",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("annual");

  const { symbol, monthly, annualMonthly } = PRICES;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section
        className="py-24 text-center px-4 sm:px-6 w-full"
        style={{ backgroundColor: "#eeece7", backgroundImage: "linear-gradient(rgba(238,236,231,0.6), rgba(238,236,231,0.6)), url('/topography.svg')" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Try Loremaster free for 14 days. No credit card required.
          </p>
        </div>
      </section>

      {/* Tier cards */}
      <section className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        {/* Toggles */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-8 mt-8">
          {/* Billing toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1 text-sm">
            {(["monthly", "annual"] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  billing === b
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b === "monthly" ? "Monthly" : "Annual"}
                {b === "annual" && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Save 25%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-2xl mx-auto w-full">
          {tiers.map((tier) => {
            const price = tier.paid
              ? `${symbol}${billing === "annual" ? annualMonthly : monthly}`
              : "Free";
            const priceDetail = tier.paid
              ? billing === "annual"
                ? "/ mo, billed annually"
                : "/ mo"
              : "forever";

            if (tier.highlighted) {
              return (
                <div
                  key={tier.name}
                  className="relative p-px rounded-lg bg-linear-to-br from-amber-400/90 via-primary/70 to-amber-500/90"
                  style={{
                    boxShadow: "0 8px 40px rgba(13,24,40,0.14), 0 0 32px rgba(217,119,6,0.10)",
                  }}
                >
                  <div className="relative rounded-[calc(0.5rem-1px)] bg-card p-8 flex flex-col gap-6 h-full">
                  {tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-card border border-amber-400/70 text-amber-800 whitespace-nowrap">
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {tier.name}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{price}</span>
                      <span className="text-sm text-muted-foreground">{priceDetail}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={tier.ctaHref}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90 bg-primary text-primary-foreground"
                    >
                      {tier.cta}
                      <ChevronRight size={14} />
                    </Link>
                    <Link href="/login" className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors">
                      Already have an account? Sign in
                    </Link>
                  </div>

                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>
              );
            }

            return (
              <div key={tier.name} className="relative rounded-lg border border-border bg-card p-8 flex flex-col gap-6 h-full">
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
                    <span className="text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-sm text-muted-foreground">{priceDetail}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0 text-foreground" />
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
          <table className="w-full text-sm min-w-100">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 font-medium text-muted-foreground w-1/2">Feature</th>
                <th className="text-center px-4 py-4 font-medium text-muted-foreground">Scribe</th>
                <th className="text-center px-4 py-4 font-medium text-foreground">Loremaster</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Worlds & entities", scribe: "View only", loremaster: "Unlimited" },
                { label: "Custom entity types", scribe: false, loremaster: true },
                { label: "Interactive maps with pins", scribe: "View only", loremaster: true },
                { label: "Rich text editor with wikilinks", scribe: false, loremaster: true },
                { label: "Relationship graph explorer", scribe: true, loremaster: true },
                { label: "Spotlight search", scribe: false, loremaster: true },
                { label: "Writing workspace & projects", scribe: false, loremaster: true },
                { label: "Word goals & focus mode", scribe: false, loremaster: true },
                { label: "Image uploads", scribe: false, loremaster: true },
                { label: "Full world export", scribe: true, loremaster: true },
                { label: "Priority support", scribe: false, loremaster: true },
              ].map((row, i) => (
                <tr key={row.label} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                  {([row.scribe, row.loremaster] as (boolean | string)[]).map((val, j) => (
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
