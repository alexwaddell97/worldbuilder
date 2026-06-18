import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);

// TODO(01-02): add schema import once src/lib/db/schema.ts is created
// import * as schema from "./schema"
// export const db = drizzle(sql, { schema })

export const db = drizzle(sql);
