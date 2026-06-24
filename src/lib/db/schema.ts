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
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ─── custom field types ────────────────────────────────────────────────────────

export type CustomFieldType = "text" | "number" | "boolean" | "url";
export type CustomFieldDef = { key: string; label: string; type: CustomFieldType };
export type CustomFieldsSchema = { fields: CustomFieldDef[] };
export type CustomFieldValues = Record<string, string | number | boolean | null>;

// ─── worlds ───────────────────────────────────────────────────────────────────

export const worlds = pgTable(
  "worlds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // per-user unique URL slug (e.g. "my-fantasy-world") — uniqueness enforced per owner via composite constraint below
    slug: text("slug").notNull(),
    // references Better Auth user.id — text not uuid (Better Auth uses CUID/text IDs)
    // No FK constraint here: Better Auth manages its own table separately.
    // Referential integrity enforced at the application layer.
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => ({
    // composite: slug unique per owner (not globally) — Phase 2 UAT-5
    ownerSlugUnique: unique("worlds_owner_id_slug_unique").on(
      table.ownerId,
      table.slug
    ),
  })
);

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
    customFieldsSchema: jsonb("custom_fields_schema")
      .$type<CustomFieldsSchema>()
      .default({ fields: [] })
      .notNull(),
  },
  (table) => ({
    worldSlugUnique: unique("entity_types_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
);

// ─── entities ─────────────────────────────────────────────────────────────────

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    entityTypeId: uuid("entity_type_id")
      .notNull()
      .references(() => entityTypes.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    // Phase 4 Tiptap JSON — nullable, not populated in Phase 3
    content: jsonb("content"),
    tags: text("tags").array().default([]).notNull(),
    imageUrl: text("image_url"),
    customFields: jsonb("custom_fields")
      .$type<CustomFieldValues>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    worldSlugUnique: unique("entities_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
    tagsGinIdx: index("entities_tags_gin_idx").using("gin", table.tags),
  })
);

// ─── exports ──────────────────────────────────────────────────────────────────

export * from "./auth-schema";

export const appSchema = { worlds, entityTypes, entities };
export type AppSchema = typeof appSchema;

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
export type EntityType = typeof entityTypes.$inferSelect;
export type NewEntityType = typeof entityTypes.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
