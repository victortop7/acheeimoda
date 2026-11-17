import type { Env } from '../lib/types';
import type { ProdutoShopee } from '../lib/shopee';
import { itemVitrine, temDescontoReal, tipoDe } from '../lib/post';

// GET /api/vitrine  (publico)
// Devolve ate 8 produtos reais de moda das ultimas 24 h (os mesmos que alimentam os posts),
// com foto, preco e link de afiliado, para a vitrine da landing. Sem dados de ninguem.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=300',
  };
  try {
    const res = await env.DB.prepare(
      `SELECT json FROM candidatos WHERE criado_em >= datetime('now', '-24 hours') ORDER BY criado_em DESC, item_id ASC LIMIT 80`
    ).all<{ json: string }>();
    const produtos = res.results.map((r) => JSON.parse(r.json) as ProdutoShopee);

    // Prefere os que tem desconto real (saem com DE/POR); no maximo 2 por tipo de peca para variar
    const comDesconto = produtos.filter(temDescontoReal);
    const base = comDesconto.length >= 6 ? comDesconto : produtos;
    const porTipo: Record<string, number> = {};
    const escolhidos: ProdutoShopee[] = [];
    for (const p of base) {
      const tipo = tipoDe(p.productName);
      porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;
      if (porTipo[tipo] <= 2) escolhidos.push(p);
      if (escolhidos.length === 8) break;
    }

    return new Response(JSON.stringify({ itens: escolhidos.map(itemVitrine) }), { headers });
  } catch {
    return new Response(JSON.stringify({ itens: [] }), { headers });
  }
};
