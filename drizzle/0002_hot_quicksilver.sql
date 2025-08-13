CREATE TYPE "public"."project_snapshot_version" AS ENUM('V1');--> statement-breakpoint
CREATE TABLE "project_snapshot" (
	"id" uuid PRIMARY KEY NOT NULL,
	"modified_at" timestamp with time zone NOT NULL,
	"name" varchar(32),
	"is_autosafe" boolean NOT NULL,
	"body" jsonb NOT NULL,
	"version" "project_snapshot_version" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "project_snapshot_id_modified_at_idx" ON "project_snapshot" USING btree ("id","modified_at");