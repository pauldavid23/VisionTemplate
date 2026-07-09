import { useState } from "react";
import type { Route } from "./+types/api-demo";
import { Button } from "../components/Button";

export function meta(_: Route.MetaArgs) {
  return [{ title: "API Demo" }];
}

type PingResult = {
  pong: boolean;
  echo?: string | null;
  serverTime: string;
  uptimeSeconds?: number;
};

export default function ApiDemo() {
  const [ping, setPing] = useState<PingResult | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"ping" | "advice" | null>(null);

  async function handlePing() {
    setLoading("ping");
    setError(null);
    try {
      const started = performance.now();
      const response = await fetch("/api/ping", {
        method: message.trim() ? "POST" : "GET",
        ...(message.trim() && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setPingMs(Math.round(performance.now() - started));
      setPing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleAdvice() {
    setLoading("advice");
    setError(null);
    try {
      const response = await fetch("/api/advice");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      setAdvice(data.advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">API demo</h1>
      <p className="mt-2 text-muted-foreground">
        Two ways to prove the backend is alive — no API keys required.
      </p>

      {/* Ping / pong */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground">Ping the server</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Calls <code>/api/ping</code>. Leave the box empty for a plain GET, or
          type a message and the server will echo it back via POST.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message to echo…"
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={handlePing} disabled={loading !== null}>
            {loading === "ping" ? "Pinging…" : "Ping"}
          </Button>
        </div>
        {ping && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground">
            <div>
              pong: {String(ping.pong)}{" "}
              {pingMs !== null && (
                <span className="text-muted-foreground">
                  ({pingMs} ms round trip)
                </span>
              )}
            </div>
            <div>serverTime: {ping.serverTime}</div>
            {ping.uptimeSeconds !== undefined && (
              <div>uptimeSeconds: {ping.uptimeSeconds}</div>
            )}
            {ping.echo != null && <div>echo: {ping.echo}</div>}
          </div>
        )}
      </div>

      {/* External fetch */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground">
          Server-side external fetch
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Calls <code>/api/advice</code>, which makes the backend fetch a random
          piece of advice from the free adviceslip.com API and relay it back.
        </p>
        <div className="mt-4">
          <Button
            onClick={handleAdvice}
            variant="outline"
            disabled={loading !== null}
          >
            {loading === "advice" ? "Fetching…" : "Get random advice"}
          </Button>
        </div>
        {advice && (
          <blockquote className="mt-4 rounded-lg border border-border bg-background p-4 text-sm italic leading-relaxed text-foreground">
            "{advice}"
          </blockquote>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-500">
          {error}
        </div>
      )}
    </section>
  );
}
