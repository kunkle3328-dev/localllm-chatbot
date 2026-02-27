
CREATE TABLE IF NOT EXISTS memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,
  importance FLOAT DEFAULT 1.0,
  timestamp INTEGER DEFAULT (strftime('%s','now'))
);
