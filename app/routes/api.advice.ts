import type { Route } from "./+types/api.advice";

// GET /api/advice — server-side fetch to a free public API (no key needed),
// demonstrating the backend calling an external service.
export async function loader(_: Route.LoaderArgs) {
  try {
    const response = await fetch("https://api.adviceslip.com/advice", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`Upstream responded with ${response.status}`);
    }
    const data = await response.json();
    return Response.json({
      advice: data.slip.advice,
      source: "adviceslip.com",
    });
  } catch (error) {
    console.error("External fetch failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "External fetch failed",
      },
      { status: 502 },
    );
  }
}
