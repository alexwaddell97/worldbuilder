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
  real,
  integer,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

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
    // globally unique slug for the public share URL — set on first publish
    publicSlug: text("public_slug").unique(),
    imageUrl: text("image_url"),
    backgroundImageUrl: text("background_image_url"),
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
    // user-specified plural form (e.g. "People" for "Person") — falls back to auto-pluralize if null
    namePlural: text("name_plural"),
    // machine-readable slug (e.g. "character") — unique within a world
    slug: text("slug").notNull(),
    // Lucide icon name string (e.g. "user", "map-pin") — nullable
    icon: text("icon"),
    // distinguishes seeded built-in types from user-created types
    isBuiltIn: boolean("is_built_in").default(false).notNull(),
    isHiddenFromPublic: boolean("is_hidden_from_public").default(false).notNull(),
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
    imagePosition: text("image_position"),
    isHiddenFromPublic: boolean("is_hidden_from_public").default(false).notNull(),
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

// ─── maps ─────────────────────────────────────────────────────────────────────

export const maps = pgTable(
  "maps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    description: text("description"),
    parentMapId: uuid("parent_map_id").references((): AnyPgColumn => maps.id, { onDelete: "set null" }),
    isHiddenFromPublic: boolean("is_hidden_from_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    worldSlugUnique: unique("maps_world_id_slug_unique").on(
      table.worldId,
      table.slug
    ),
  })
);

// ─── map_pins ─────────────────────────────────────────────────────────────────

export const mapPins = pgTable("map_pins", {
  id: uuid("id").defaultRandom().primaryKey(),
  mapId: uuid("map_id")
    .notNull()
    .references(() => maps.id, { onDelete: "cascade" }),
  // entity this pin points to — nullable (pin may link to a map instead)
  entityId: uuid("entity_id").references(() => entities.id, {
    onDelete: "set null",
  }),
  // another map this pin drills in to (e.g. a city map)
  linkedMapId: uuid("linked_map_id").references(() => maps.id, {
    onDelete: "set null",
  }),
  label: text("label"),
  // position as percentage of image dimensions (0–100)
  x: real("x").notNull(),
  y: real("y").notNull(),
  // lucide icon name — defaults to "map-pin" when null
  icon: text("icon"),
  // hex or tailwind colour token (e.g. "#ef4444")
  color: text("color"),
  // pin shape: "circle" | "shield" | "square" | "diamond"
  shape: text("shape").default("circle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── entity_relations (Phase 5) ───────────────────────────────────────────────

export const entityRelations = pgTable(
  "entity_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    sourceEntityId: uuid("source_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    targetEntityId: uuid("target_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    // free-text label: "father", "ally", "serves", etc.
    label: text("label").notNull().default("related"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    worldIdx: index("entity_relations_world_id_idx").on(table.worldId),
    sourceIdx: index("entity_relations_source_entity_id_idx").on(table.sourceEntityId),
  })
);

// ─── world_graph_settings ─────────────────────────────────────────────────────

export const worldGraphSettings = pgTable("world_graph_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" })
    .unique(),
  nodePositions: jsonb("node_positions")
    .$type<Record<string, { x: number; y: number }>>()
    .default({})
    .notNull(),
  hiddenEntityIds: text("hidden_entity_ids").array().default([]).notNull(),
  hiddenTypeIds: text("hidden_type_ids").array().default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// ─── writing_projects ─────────────────────────────────────────────────────────

export const writingProjects = pgTable(
  "writing_projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => ({
    worldSlugUnique: unique("writing_projects_world_id_slug_unique").on(t.worldId, t.slug),
  })
);

// ─── writing_documents ────────────────────────────────────────────────────────

export const writingDocuments = pgTable(
  "writing_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => writingProjects.id, { onDelete: "set null" }),
    title: text("title").notNull().default("Untitled"),
    slug: text("slug").notNull(),
    content: jsonb("content"),
    wordCount: integer("word_count").default(0).notNull(),
    wordTarget: integer("word_target"),
    isPublished: boolean("is_published").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (t) => ({
    worldSlugUnique: unique("writing_documents_world_id_slug_unique").on(t.worldId, t.slug),
    worldIdx: index("writing_documents_world_id_idx").on(t.worldId),
  })
);

// ─── exports ──────────────────────────────────────────────────────────────────

export * from "./auth-schema";

export const appSchema = { worlds, entityTypes, entities, maps, mapPins, entityRelations, worldGraphSettings, writingProjects, writingDocuments };
export type AppSchema = typeof appSchema;

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
export type EntityType = typeof entityTypes.$inferSelect;
export type NewEntityType = typeof entityTypes.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
export type MapPin = typeof mapPins.$inferSelect;
export type NewMapPin = typeof mapPins.$inferInsert;
export type NewEntity = typeof entities.$inferInsert;
export type EntityRelation = typeof entityRelations.$inferSelect;
export type NewEntityRelation = typeof entityRelations.$inferInsert;
export type WorldGraphSettings = typeof worldGraphSettings.$inferSelect;
export type WritingProject = typeof writingProjects.$inferSelect;
export type NewWritingProject = typeof writingProjects.$inferInsert;
export type WritingDocument = typeof writingDocuments.$inferSelect;
export type NewWritingDocument = typeof writingDocuments.$inferInsert;
