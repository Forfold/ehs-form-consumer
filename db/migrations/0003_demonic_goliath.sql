ALTER TABLE "accounts" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "session_state" text;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "pdf_storage_key" text;