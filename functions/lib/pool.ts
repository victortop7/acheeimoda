import type { Env } from './types';
import { buscarModaFeminina } from './shopee';
import { passaNoFiltro } from './post';

// Estoque local de produtos ja filtrados. A API da Shopee oscila muito, entao em vez de buscar
// a cada post, abastecemos o estoque aos poucos (2 paginas por vez) e sorteamos dele.
const MINIMO_NO_ESTOQUE = 15;
const PAGINAS_POR_VEZ = 2;
const ULTIMA_PAGINA = 40;
const VALIDADE_HORAS = 24; // preco e estoque mudam: descarta o que ficou velho

export async function garantePool(env: Env): Promise<void> {
  await env.DB.prepare(`DELETE FROM candidatos WHERE criado_em < datetime('now', '-${VALIDADE_HORAS} hours')`).run();

  const restantes = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM candidatos
     WHERE usado = 0 AND item_id NOT IN (SELECT item_id FROM posts WHERE criado_em >= datetime('now', '-30 days'))`
  ).first<{ n: number }>();
  if ((restantes?.n ?? 0) >= MINIMO_NO_ESTOQUE) return;

  const estado = await env.DB.prepare(`SELECT valor FROM estado WHERE chave = 'pagina'`).first<{ valor: string }>();
  let pagina = Math.max(1, parseInt(estado?.valor ?? '1', 10) || 1);

  for (let i = 0; i < PAGINAS_POR_VEZ; i++) {
    const produtos = await buscarModaFeminina(env, pagina);
    if (produtos.length === 0) {
      pagina = 1;
      break;
    }
    const bons = produtos.filter(passaNoFiltro);
    if (bons.length > 0) {
      await env.DB.batch(
        bons.map((p) =>
          env.DB.prepare(`INSERT OR IGNORE INTO candidatos (item_id, json) VALUES (?, ?)`).bind(p.itemId, JSON.stringify(p))
        )
      );
    }
    pagina = pagina >= ULTIMA_PAGINA ? 1 : pagina + 1;
  }

  await env.DB.prepare(
    `INSERT INTO estado (chave, valor) VALUES ('pagina', ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`
  )
    .bind(String(pagina))
    .run();
}
