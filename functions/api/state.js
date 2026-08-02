const MAX_PAYLOAD_BYTES = 2_000_000;

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS dashboard_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);

  try {
    await ensureSchema(env.DB);
    const row = await env.DB
      .prepare("SELECT data, updated_at FROM dashboard_state WHERE id = 1")
      .first();

    if (!row) return json({ error: "Not found" }, 404);

    return json({ data: JSON.parse(row.data), updatedAt: row.updated_at });
  } catch (error) {
    console.error("D1 GET failed", error);
    return json({ error: "Database unavailable" }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return json({ error: "Missing dashboard data" }, 400);
  }

  const payload = JSON.stringify(body.data);
  if (new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) {
    return json({ error: "Payload too large" }, 413);
  }

  try {
    await ensureSchema(env.DB);
    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        INSERT INTO dashboard_state (id, data, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `)
      .bind(payload, now)
      .run();

    return json({ ok: true, updatedAt: now });
  } catch (error) {
    console.error("D1 PUT failed", error);
    return json({ error: "Database unavailable" }, 500);
  }
}
