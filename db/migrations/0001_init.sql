-- Baseline schema. Idempotent: safe to run against a database that was already
-- bootstrapped by db/setup.sql. Seed data lives in setup.sql (fresh DBs only),
-- NOT here, so applying this migration never duplicates rows.
--
-- Add future schema changes as new files: db/migrations/0002_*.sql, etc.
-- Keep them backward-compatible (expand/contract) so the currently-running app
-- keeps working while the new image is being rolled out.
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
