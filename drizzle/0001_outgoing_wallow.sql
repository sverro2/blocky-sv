CREATE TYPE "public"."media_type" AS ENUM('audio', 'video');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "media_type" "media_type" DEFAULT 'audio' NOT NULL;