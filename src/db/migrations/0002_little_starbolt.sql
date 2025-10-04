ALTER TYPE "public"."rental_status" ADD VALUE 'partial_return' BEFORE 'returned';--> statement-breakpoint
ALTER TABLE "rental_items" ADD COLUMN "quantity_returned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rental_items" ADD COLUMN "return_date" date;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "next_return_date" date;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "return_payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "return_payment_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "return_notes" text;