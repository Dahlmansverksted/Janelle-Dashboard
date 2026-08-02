CREATE TABLE IF NOT EXISTS dashboard_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
