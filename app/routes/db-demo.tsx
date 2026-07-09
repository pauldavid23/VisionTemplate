import { Form, useNavigation } from "react-router";
import type { Route } from "./+types/db-demo";
import { Button } from "../components/Button";
import { createNote, deleteNote, listNotes } from "../lib/db.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "DB Demo — Postgres" }];
}

export async function loader(_: Route.LoaderArgs) {
  const notes = await listNotes();
  return { notes };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deleteNote(Number(formData.get("id")));
    return { ok: true };
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title) {
    return { error: "Title is required" };
  }
  await createNote(title, content);
  return { ok: true };
}

export default function DbDemo({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <section className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Postgres demo</h1>
      <p className="mt-2 text-muted-foreground">
        These notes live in the local <code>vision_template</code> database
        (table <code>notes</code>). Adding or deleting a note runs a real SQL
        query through the server loader/action. The same data is also exposed as
        JSON at <code>/api/notes</code>.
      </p>

      <Form
        method="post"
        className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
      >
        <input
          name="title"
          placeholder="Note title"
          required
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <textarea
          name="content"
          placeholder="Note content (optional)"
          rows={3}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add note"}
          </Button>
          {actionData && "error" in actionData && actionData.error && (
            <span className="text-sm text-red-500">{actionData.error}</span>
          )}
        </div>
      </Form>

      <ul className="mt-8 flex flex-col gap-3">
        {loaderData.notes.map((note) => (
          <li
            key={note.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div>
              <h3 className="font-medium text-foreground">{note.title}</h3>
              {note.content && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.content}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                #{note.id} · {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={note.id} />
              <Button type="submit" variant="outline" size="sm" disabled={busy}>
                Delete
              </Button>
            </Form>
          </li>
        ))}
        {loaderData.notes.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No notes yet — add one above.
          </li>
        )}
      </ul>
    </section>
  );
}
