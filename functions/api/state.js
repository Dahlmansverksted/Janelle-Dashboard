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

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: "D1 binding DB is missing" }, 500);

  const row = await env.DB
    .prepare("SELECT data, updated_at FROM dashboard_state WHERE id = 1")
    .first();

  if (!row) return json({ error: "Not found" }, 404);

  try {
    return json({ data: JSON.parse(row.data), updatedAt: row.updated_at });
  } catch {
    return json({ error: "Stored dashboard data is invalid" }, 500);
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
}
