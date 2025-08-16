DROP INDEX "project_snapshot_id_modified_at_idx";--> statement-breakpoint
ALTER TABLE "project_snapshot" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "project_snapshot" ADD CONSTRAINT "project_snapshot_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_snapshot_id_project_id_modified_at_idx" ON "project_snapshot" USING btree ("id","project_id","modified_at");