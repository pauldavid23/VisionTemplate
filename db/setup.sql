
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
  content TEXT NOT NULL DEFAULT ''
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO notes (title, content) VALUES
  ('Welcome', 'This note was seeded into your local Postgres database.')
  ('It works', 'If you can see this on the DB page, Postgres is connected.');
