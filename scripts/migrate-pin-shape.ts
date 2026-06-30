/**
 * One-time migration: add shape column to map_pins.
 *
 * Run: npx tsx scripts/migrate-pin-shape.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  await db.execute(sql.raw(`ALTER TABLE map_pins ADD COLUMN IF NOT EXISTS shape text DEFAULT 'circle'`));
  console.log("Done: shape column added to map_pins.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
