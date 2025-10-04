ALTER TABLE "customers" RENAME COLUMN "email" TO "short_name";--> statement-breakpoint
DROP INDEX "customers_email_idx";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "latitude" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "longitude" varchar(50);