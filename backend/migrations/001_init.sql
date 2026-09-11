-- Kanini Padhai — initial schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Teachers / admins: the account that actually logs in with a password
CREATE TABLE IF NOT EXISTS teachers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  school_name   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Students: profiles under a teacher. No password of their own for v1 —
-- selected by the teacher/kiosk device, or later given a simple PIN.
CREATE TABLE IF NOT EXISTS students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  class_level  SMALLINT NOT NULL CHECK (class_level BETWEEN 1 AND 8),
  pin_hash     TEXT,                    -- optional, for later self-login
  avatar_seed  TEXT,                    -- for a fun kid-friendly avatar
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);

-- One row per (student, subject, class, term, topic, resource) completion.
-- resource_key mirrors the frontend's stable item key: "<class>-<term>-<topic>-<title>"
CREATE TABLE IF NOT EXISTS progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL DEFAULT 'Maths',
  class_level   SMALLINT NOT NULL,
  term          TEXT NOT NULL,
  topic         TEXT NOT NULL,
  resource_key  TEXT NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject, resource_key)
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_lookup ON progress(student_id, subject, class_level);

-- Refresh tokens for session management (simple rotation model)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_refresh_teacher ON refresh_tokens(teacher_id);
