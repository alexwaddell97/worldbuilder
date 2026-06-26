ALTER TABLE "maps" ADD COLUMN "parent_map_id" uuid REFERENCES "maps"("id") ON DELETE SET NULL;
