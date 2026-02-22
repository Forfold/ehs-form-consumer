-- Migration: 0002_teams
-- Applied: 2026-02-21
-- Description: Teams (AD-groups) for sharing form submissions among users

CREATE TABLE teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_by UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id   UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX ON team_members (user_id);

CREATE TABLE form_submission_teams (
  form_submission_id UUID        NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  team_id            UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  added_by           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (form_submission_id, team_id)
);
CREATE INDEX ON form_submission_teams (team_id);
