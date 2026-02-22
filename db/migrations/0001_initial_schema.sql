-- Migration: 0001_initial_schema
-- Applied: 2026-02-21
-- Description: Users, dynamic form submissions, field visualization preferences, and user settings

DROP TABLE IF EXISTS form_history;

CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  form_type    TEXT,
  display_name TEXT,
  data         JSONB       NOT NULL
);

CREATE INDEX ON form_submissions (user_id, processed_at DESC);
CREATE INDEX ON form_submissions (user_id, form_type);
CREATE INDEX ON form_submissions USING GIN (data);

CREATE TABLE user_field_preferences (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_type     TEXT,
  field_key     TEXT     NOT NULL,
  display_label TEXT     NOT NULL,
  visualization TEXT     NOT NULL DEFAULT 'text'
    CHECK (visualization IN ('text', 'badge', 'table', 'bar_chart', 'pie_chart', 'boolean')),
  position      SMALLINT NOT NULL DEFAULT 0,
  enabled       BOOLEAN  NOT NULL DEFAULT TRUE
);

CREATE INDEX ON user_field_preferences (user_id, form_type, position);
CREATE UNIQUE INDEX ON user_field_preferences (user_id, form_type, field_key)
  NULLS NOT DISTINCT;

CREATE TABLE user_settings (
  user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  feature_flags JSONB       NOT NULL DEFAULT '{}',
  preferences   JSONB       NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
