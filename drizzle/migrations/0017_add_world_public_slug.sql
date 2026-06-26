ALTER TABLE "worlds" ADD COLUMN "public_slug" text;
CREATE UNIQUE INDEX "worlds_public_slug_unique" ON "worlds" ("public_slug");
