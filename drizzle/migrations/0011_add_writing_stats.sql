ALTER TABLE "writing_documents" ADD COLUMN "word_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "writing_documents" ADD COLUMN "word_target" integer;