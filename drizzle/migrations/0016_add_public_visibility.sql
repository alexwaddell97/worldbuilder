ALTER TABLE "entity_types" ADD COLUMN "is_hidden_from_public" boolean NOT NULL DEFAULT false;
ALTER TABLE "entities" ADD COLUMN "is_hidden_from_public" boolean NOT NULL DEFAULT false;
