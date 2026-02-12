ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "age";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "username_length" CHECK (length("user"."email") <= 64);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "email_length" CHECK (length("user"."email") <= 254);