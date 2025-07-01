CREATE TABLE "project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"name" varchar(255),
	"description" text
);
