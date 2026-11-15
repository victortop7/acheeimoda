CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, nome TEXT NOT NULL, tipo TEXT NOT NULL, preco TEXT, status TEXT NOT NULL DEFAULT 'reservado', message_id TEXT, criado_em TEXT NOT NULL DEFAULT (datetime('now')), enviado_em TEXT);
CREATE INDEX IF NOT EXISTS idx_posts_item ON posts (item_id, criado_em);
