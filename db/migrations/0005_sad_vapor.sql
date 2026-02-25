ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "facility_name" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "facility_address" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "permit_number" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "inspection_date" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "inspector_name" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "facility_name"    DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "facility_address" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "permit_number"    DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "inspection_date"  DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "inspector_name"   DROP DEFAULT;
