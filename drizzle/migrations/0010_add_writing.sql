CREATE TABLE "writing_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"project_id" uuid,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writing_documents_world_id_slug_unique" UNIQUE("world_id","slug")
);
--> statement-breakpoint
CREATE TABLE "writing_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writing_projects_world_id_slug_unique" UNIQUE("world_id","slug")
);
--> statement-breakpoint
ALTER TABLE "writing_documents" ADD CONSTRAINT "writing_documents_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_documents" ADD CONSTRAINT "writing_documents_project_id_writing_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."writing_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_projects" ADD CONSTRAINT "writing_projects_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "writing_documents_world_id_idx" ON "writing_documents" USING btree ("world_id");