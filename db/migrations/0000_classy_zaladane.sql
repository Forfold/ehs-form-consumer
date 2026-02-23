-- Initial schema (previously applied manually; recreated here for fresh-database deployments)

CREATE TABLE "users" (
  "id"             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "name"           text,
  "email"          text        UNIQUE,
  "email_verified" timestamp,
  "image"          text,
  "is_admin"       boolean     NOT NULL DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "accounts" (
  "user_id"             uuid    NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type"                text    NOT NULL,
  "provider"            text    NOT NULL,
  "provider_account_id" text    NOT NULL,
  "refresh_token"       text,
  "access_token"        text,
  "expires_at"          integer,
  "token_type"          text,
  "scope"               text,
  "id_token"            text,
  "session_state"       text,
  PRIMARY KEY ("provider", "provider_account_id")
);
--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");
--> statement-breakpoint
CREATE TABLE "sessions" (
  "session_token" text      PRIMARY KEY,
  "user_id"       uuid      NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires"       timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
  "identifier" text      NOT NULL,
  "token"      text      NOT NULL,
  "expires"    timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
  "id"           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"      uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "file_name"    text        NOT NULL,
  "processed_at" timestamptz NOT NULL DEFAULT now(),
  "form_type"    text,
  "display_name" text,
  "data"         jsonb       NOT NULL
);
--> statement-breakpoint
CREATE INDEX "form_submissions_user_id_processed_at_idx" ON "form_submissions" ("user_id", "processed_at");
--> statement-breakpoint
CREATE INDEX "form_submissions_user_id_form_type_idx" ON "form_submissions" ("user_id", "form_type");
--> statement-breakpoint
CREATE INDEX ON "form_submissions" USING GIN ("data");
--> statement-breakpoint
CREATE TABLE "teams" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       text        NOT NULL,
  "created_by" uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
  "team_id"   uuid        NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id"   uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"      text        NOT NULL DEFAULT 'member',
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("team_id", "user_id")
);
--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" ("user_id");
--> statement-breakpoint
CREATE TABLE "form_submission_teams" (
  "form_submission_id" uuid        NOT NULL REFERENCES "form_submissions"("id") ON DELETE CASCADE,
  "team_id"            uuid        NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "added_by"           uuid        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "added_at"           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("form_submission_id", "team_id")
);
--> statement-breakpoint
CREATE INDEX "form_submission_teams_team_id_idx" ON "form_submission_teams" ("team_id");
--> statement-breakpoint
CREATE TABLE "user_field_preferences" (
  "id"            uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       uuid     NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "form_type"     text,
  "field_key"     text     NOT NULL,
  "display_label" text     NOT NULL,
  "visualization" text     NOT NULL DEFAULT 'text',
  "position"      smallint NOT NULL DEFAULT 0,
  "enabled"       boolean  NOT NULL DEFAULT true
);
--> statement-breakpoint
CREATE INDEX "user_field_preferences_user_id_form_type_position_idx" ON "user_field_preferences" ("user_id", "form_type", "position");
--> statement-breakpoint
CREATE UNIQUE INDEX ON "user_field_preferences" ("user_id", "form_type", "field_key") NULLS NOT DISTINCT;
--> statement-breakpoint
CREATE TABLE "user_settings" (
  "user_id"       uuid        PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "feature_flags" jsonb       NOT NULL DEFAULT '{}',
  "preferences"   jsonb       NOT NULL DEFAULT '{}',
  "updated_at"    timestamptz NOT NULL DEFAULT now()
);
