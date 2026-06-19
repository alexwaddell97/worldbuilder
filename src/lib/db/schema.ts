// Phase 1 schema: worlds + entity_types only (D-08, D-09)
// Better Auth auth tables (user, session, account, verification) are NOT defined here.
// They are managed by Better Auth's migrate() call. See src/lib/auth/index.ts.
// Subsequent phases add their own tables (entities → Phase 3, entity_relations → Phase 5, etc.)

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ─── worlds ───────────────────────────────────────────────────────────────────

export const worlds = pgTable("worlds", {
  id: uuid("id").defaultRandom().primaryKey(),
  // globally unique URL slug (e.g. "my-fantasy-world")
  slug: text("slug").notNull().unique(),
  // references Better Auth user.id — text not uuid (Better Auth uses CUID/text IDs)
  // No FK constraint here: Better Auth manages its own table separately.
  // Referential integrity enforced at the application layer.
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// ─── entity_types ─────────────────────────────────────────────────────────────

export const entityTypes = pgTable(
  "entity_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // machine-readable slug (e.g. "character") — unique within a world
    slug: text("slug").notNull(),
    // Lucide icon name string (e.g. "user", "map-pin") — nullable
    icon: text("icon"),
    // distinguishes seeded built-in types from user-created types
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    worldSlugUnique: unique("entity_types_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
);

// ─── exports ──────────────────────────────────────────────────────────────────

export * from "./auth-schema";

export const schema = { worlds, entityTypes };

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
export type EntityType = typeof entityTypes.$inferSelect;
export type NewEntityType = typeof entityTypes.$inferInsert;
