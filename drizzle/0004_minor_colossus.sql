CREATE TYPE "public"."codec" AS ENUM('default_opus_v1', 'default_webp_v1');--> statement-breakpoint
CREATE TYPE "public"."recording_type" AS ENUM('audio', 'video', 'photo', 'text');--> statement-breakpoint
CREATE TYPE "public"."recording_usecase" AS ENUM('original', 'proxy', 'render');--> statement-breakpoint
CREATE TABLE "alternative" (
	"id" uuid PRIMARY KEY NOT NULL,
	"block_id" uuid NOT NULL,
	"name" text NOT NULL,
	"modified_at" timestamp with time zone NOT NULL,
	"description" text,
	"duration_seconds" text,
	"clip_offset_start_seconds" numeric,
	"clip_offset_end_seconds" numeric,
	"recording_type" "recording_type" NOT NULL,
	"recording_id" uuid,
	CONSTRAINT "alternative_name_length" CHECK (length("alternative"."name") <= 128),
	CONSTRAINT "alternative_duration_seconds_length" CHECK (length("alternative"."duration_seconds") <= 32)
);
--> statement-breakpoint
CREATE TABLE "block" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_snapshot_id" uuid NOT NULL,
	"version" timestamp with time zone NOT NULL,
	"version_name" text,
	"name" text NOT NULL,
	"description" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"current_alternative_id" uuid,
	"order_index" integer NOT NULL,
	CONSTRAINT "block_version_name_length" CHECK (length("block"."version_name") <= 64),
	CONSTRAINT "block_name_length" CHECK (length("block"."name") <= 128)
);
--> statement-breakpoint
CREATE TABLE "recording" (
	"id" uuid PRIMARY KEY NOT NULL,
	"alternative_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"estimated_duration_millis" integer,
	"codec" "codec" NOT NULL,
	"resolution" text,
	"usecase" "recording_usecase" NOT NULL,
	"extras" jsonb,
	CONSTRAINT "recording_filename_length" CHECK (length("recording"."filename") <= 256),
	CONSTRAINT "recording_resolution_length" CHECK (length("recording"."resolution") <= 32)
);
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_snapshot" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "alternative" ADD CONSTRAINT "alternative_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_project_snapshot_id_project_snapshot_id_fk" FOREIGN KEY ("project_snapshot_id") REFERENCES "public"."project_snapshot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_alternative_id_alternative_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."alternative"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alternative_block_id_idx" ON "alternative" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "block_project_snapshot_id_idx" ON "block" USING btree ("project_snapshot_id");--> statement-breakpoint
CREATE INDEX "block_order_idx" ON "block" USING btree ("project_snapshot_id","order_index");--> statement-breakpoint
CREATE INDEX "recording_alternative_id_idx" ON "recording" USING btree ("alternative_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_name_length" CHECK (length("project"."name") <= 32);--> statement-breakpoint
ALTER TABLE "project_snapshot" ADD CONSTRAINT "project_snapshot_name_length" CHECK (length("project_snapshot"."name") <= 32);