/**
 * One-time migration: replace Lucide icon names in entity_types and map_pins
 * with their game-icons (gi:) equivalents.
 *
 * Run: npx tsx scripts/migrate-icons.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const LUCIDE_TO_GI: Record<string, string> = {
  "user":            "gi:cowled",
  "users":           "gi:two-shadows",
  "user-round":      "gi:hooded-figure",
  "crown":           "gi:crown",
  "shield":          "gi:shield",
  "sword":           "gi:broadsword",
  "wand":            "gi:magic-swirl",
  "graduation-cap":  "gi:spell-book",
  "map-pin":         "gi:treasure-map",
  "map":             "gi:treasure-map",
  "castle":          "gi:castle",
  "mountain":        "gi:mountains",
  "trees":           "gi:forest",
  "building":        "gi:medieval-gate",
  "building-2":      "gi:guarded-tower",
  "home":            "gi:wood-cabin",
  "warehouse":       "gi:wood-cabin",
  "tent":            "gi:camping-tent",
  "package":         "gi:chest",
  "gem":             "gi:crystal-shine",
  "key":             "gi:key",
  "scroll":          "gi:scroll-unfurled",
  "book":            "gi:spell-book",
  "book-open":       "gi:spell-book",
  "flask-conical":   "gi:health-potion",
  "hammer":          "gi:blacksmith",
  "swords":          "gi:crossed-swords",
  "wand-2":          "gi:magic-swirl",
  "calendar":        "gi:pocket-watch",
  "clock":           "gi:pocket-watch",
  "zap":             "gi:lightning-helix",
  "flame":           "gi:campfire",
  "sun":             "gi:sun",
  "moon":            "gi:crescent-blade",
  "star":            "gi:star-formation",
  "flag":            "gi:flag-objective",
  "globe":           "gi:globe",
  "network":         "gi:family-tree",
  "layers":          "gi:world",
  "tag":             "gi:price-tag",
};

async function buildCaseExpression(column: string): Promise<string> {
  const clauses = Object.entries(LUCIDE_TO_GI)
    .map(([from, to]) => `WHEN ${column} = '${from}' THEN '${to}'`)
    .join("\n    ");
  return `CASE\n    ${clauses}\n    ELSE ${column}\n  END`;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  const caseExpr = await buildCaseExpression("icon");

  // entity_types
  const etResult = await db.execute(
    sql.raw(`UPDATE entity_types SET icon = ${caseExpr} WHERE icon IN (${Object.keys(LUCIDE_TO_GI).map(k => `'${k}'`).join(",")}) RETURNING id`)
  );
  console.log(`entity_types updated: ${etResult.rows.length} rows`);

  // map_pins
  const mpResult = await db.execute(
    sql.raw(`UPDATE map_pins SET icon = ${caseExpr} WHERE icon IS NOT NULL AND icon IN (${Object.keys(LUCIDE_TO_GI).map(k => `'${k}'`).join(",")}) RETURNING id`)
  );
  console.log(`map_pins updated: ${mpResult.rows.length} rows`);

  await pool.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
