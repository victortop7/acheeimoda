CREATE TABLE IF NOT EXISTS agenda (dia TEXT NOT NULL, horario TEXT NOT NULL, criado_em TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (dia, horario));
