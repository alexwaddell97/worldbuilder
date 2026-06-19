ALTER TABLE "worlds" DROP CONSTRAINT "worlds_slug_unique";--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_owner_id_slug_unique" UNIQUE("owner_id","slug");