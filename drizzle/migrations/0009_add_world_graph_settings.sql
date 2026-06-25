CREATE TABLE "world_graph_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"node_positions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hidden_entity_ids" text[] DEFAULT '{}' NOT NULL,
	"hidden_type_ids" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "world_graph_settings_world_id_unique" UNIQUE("world_id")
);
--> statement-breakpoint
ALTER TABLE "world_graph_settings" ADD CONSTRAINT "world_graph_settings_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;