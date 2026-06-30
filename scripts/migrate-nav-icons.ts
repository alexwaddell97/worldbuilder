/**
 * One-time migration: replace platform-nav icon names in entity_types and map_pins.
 *
 * Run: npx tsx scripts/migrate-nav-icons.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const REPLACEMENTS: Record<string, string> = {
  "gi:treasure-map": "gi:position-marker",
  "gi:family-tree":  "gi:compass",
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  const inList = Object.keys(REPLACEMENTS).map((k) => `'${k}'`).join(", ");
  const caseExpr = Object.entries(REPLACEMENTS)
    .map(([from, to]) => `WHEN icon = '${from}' THEN '${to}'`)
    .join("\n    ");
  const expr = `CASE\n    ${caseExpr}\n    ELSE icon\n  END`;

  const etResult = await db.execute(
    sql.raw(`UPDATE entity_types SET icon = ${expr} WHERE icon IN (${inList}) RETURNING id, icon`)
  );
  console.log(`entity_types updated: ${etResult.rows.length} rows`);
  etResult.rows.forEach((r) => console.log(`  ${r.id} → ${r.icon}`));

  const mpResult = await db.execute(
    sql.raw(`UPDATE map_pins SET icon = ${expr} WHERE icon IN (${inList}) RETURNING id, icon`)
  );
  console.log(`map_pins updated: ${mpResult.rows.length} rows`);
  mpResult.rows.forEach((r) => console.log(`  ${r.id} → ${r.icon}`));

  await pool.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
