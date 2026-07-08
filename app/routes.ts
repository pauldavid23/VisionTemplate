import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/db-demo", "routes/db-demo.tsx"),
  route("/api-demo", "routes/api-demo.tsx"),
  route("/api/notes", "routes/api.notes.ts"),
  route("/api/ping", "routes/api.ping.ts"),
  route("/api/health", "routes/api.health.ts"),
  route("/api/advice", "routes/api.advice.ts"),
] satisfies RouteConfig;
