-- Equal Scales — Phase 1 Schema
-- Local SQLite database for clients, matters, templates, drafts, conversations, messages.
-- All tables use TEXT primary keys for stable, portable IDs.
-- Timestamps are ISO-8601 strings (SQLite has no native datetime).

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL,
  name          TEXT NOT NULL,
  display_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | archived
  root_path     TEXT,                            -- resolved vault path for this client
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS matters (
  id            TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL REFERENCES clients(id),
  slug          TEXT NOT NULL,
  name          TEXT NOT NULL,
  matter_type   TEXT,                            -- estate, litigation, contracts, etc.
  status        TEXT NOT NULL DEFAULT 'active',  -- active | closed | archived
  matter_path   TEXT,                            -- resolved vault path for this matter
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(client_id, slug)
);

CREATE TABLE IF NOT EXISTS templates (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  template_type   TEXT,                          -- estate, intake, litigation, contracts, etc.
  description     TEXT,
  file_format     TEXT NOT NULL DEFAULT 'markdown',  -- markdown | docx
  source_path     TEXT NOT NULL,                 -- path to template file on disk
  placeholders_json TEXT,                        -- JSON array of placeholder field names
  tags_json       TEXT,                          -- JSON array of tags
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drafts (
  id            TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL REFERENCES clients(id),
  matter_id     TEXT REFERENCES matters(id),     -- nullable: draft may be client-level
  template_id   TEXT REFERENCES templates(id),   -- nullable: draft may be manual
  title         TEXT NOT NULL,
  draft_type    TEXT,                            -- will, demand-letter, engagement-letter, etc.
  file_format   TEXT NOT NULL DEFAULT 'markdown',
  file_path     TEXT NOT NULL,                   -- path to draft file on disk
  version       INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft | awaiting_review | revised | final
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT REFERENCES clients(id),   -- nullable: general conversation
  matter_id           TEXT REFERENCES matters(id),   -- nullable: client-level conversation
  title               TEXT,
  provider            TEXT,                          -- claude | opencode
  provider_session_id TEXT,                          -- SDK session id for resumption
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role            TEXT NOT NULL,                  -- user | assistant | system
  content         TEXT NOT NULL,
  metadata_json   TEXT,                           -- optional: tool calls, attachments, etc.
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_matters_client ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_drafts_client ON drafts(client_id);
CREATE INDEX IF NOT EXISTS idx_drafts_matter ON drafts(matter_id);
CREATE INDEX IF NOT EXISTS idx_drafts_template ON drafts(template_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_matter ON conversations(matter_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
