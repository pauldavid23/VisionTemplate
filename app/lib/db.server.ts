import "dotenv/config";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/vision_template";

// Reuse a single pool across HMR reloads in dev.
const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export const pool = globalForDb.__pgPool ?? new Pool({ connectionString });

if (!globalForDb.__pgPool) {
  globalForDb.__pgPool = pool;
}

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export async function listNotes(): Promise<Note[]> {
  const { rows } = await pool.query<Note>(
    "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC, id DESC",
  );
  return rows;
}

export async function createNote(
  title: string,
  content: string,
): Promise<Note> {
  const { rows } = await pool.query<Note>(
    "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at",
    [title, content],
  );
  return rows[0];
}

export async function deleteNote(id: number): Promise<void> {
  await pool.query("DELETE FROM notes WHERE id = $1", [id]);
}
