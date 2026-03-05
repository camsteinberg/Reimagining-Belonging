-- scripts/create-analytics-table.sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  region      TEXT,
  screen_w    INTEGER,
  screen_h    INTEGER,
  event_type  TEXT DEFAULT 'pageview',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
