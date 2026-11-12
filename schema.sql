-- Schema D1 (SQLite). Executar no console do D1 (ou: wrangler d1 execute <db> --file=schema.sql)

CREATE TABLE IF NOT EXISTS grupos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT    NOT NULL,
  link       TEXT    NOT NULL UNIQUE,            -- https://chat.whatsapp.com/XXXX
  membros    INTEGER NOT NULL DEFAULT 0,         -- atualizado pelo n8n/uazapi
  limite     INTEGER NOT NULL DEFAULT 950,       -- margem abaixo dos 1024 do WhatsApp
  ativo      INTEGER NOT NULL DEFAULT 1,         -- 0 = fora da rotação
  ordem      INTEGER NOT NULL DEFAULT 0,         -- menor ordem recebe gente primeiro
  criado_em  TEXT    NOT NULL DEFAULT (datetime('now'))  -- UTC
);

CREATE TABLE IF NOT EXISTS cliques (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  grupo_id      INTEGER,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))  -- UTC
);

CREATE INDEX IF NOT EXISTS idx_grupos_rotacao ON grupos (ativo, ordem, id);
CREATE INDEX IF NOT EXISTS idx_cliques_data   ON cliques (criado_em);
