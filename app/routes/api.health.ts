import type { Route } from "./+types/api.health";
import { pool } from "../lib/db.server";

// GET /api/health — deep health check used by the deploy/rollback gate.
// Proves both that the server is answering AND that the database is reachable,
// unlike /api/ping which only proves the process is up.
export async function loader(_: Route.LoaderArgs) {
  try {
    await pool.query("SELECT 1");
    return Response.json({ ok: true, db: "up" });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        db: "down",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
