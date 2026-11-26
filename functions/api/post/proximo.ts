import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';
import type { ProdutoShopee } from '../../lib/shopee';
import { montaTexto, temDescontoReal, tipoDe } from '../../lib/post';
import { agoraSP, ritmoDoDia } from '../../lib/horario';
import { garantePool } from '../../lib/pool';

// POST /api/post/proximo
// Escolhe o proximo produto de moda feminina (que ainda nao foi postado) e devolve o texto pronto.
// Quem envia ao WhatsApp e o n8n; depois do envio ele chama /api/post/confirmar.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    // Trava de seguranca: nunca passa do teto do dia (inclui testes manuais)
    const { dia } = agoraSP();
    const { teto } = ritmoDoDia(dia);
    const hoje = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM posts WHERE date(criado_em, '-3 hours') = ?`
    )
      .bind(dia)
      .first<{ total: number }>();
    if ((hoje?.total ?? 0) >= teto) {
      return json({ ok: false, motivo: `limite diario de ${teto} posts atingido` }, 200);
    }

    // Abastece o estoque se estiver baixo. Se a Shopee falhar mas ainda houver produtos guardados, segue com eles.
    let erroAbastecer: Error | null = null;
    try {
      await garantePool(env);
    } catch (err) {
      erroAbastecer = err instanceof Error ? err : new Error('Erro ao abastecer o estoque');
    }

    const vistosRes = await env.DB.prepare(
      `SELECT item_id FROM posts WHERE criado_em >= datetime('now', '-30 days')`
    ).all<{ item_id: number }>();
    const vistos = new Set<number>(vistosRes.results.map((r) => r.item_id));

    const recentesRes = await env.DB.prepare(`SELECT tipo FROM posts ORDER BY id DESC LIMIT 3`).all<{ tipo: string }>();
    const recentes = recentesRes.results.map((r) => r.tipo);

    const estoque = await env.DB.prepare(
      `SELECT json FROM candidatos WHERE usado = 0 ORDER BY criado_em ASC, item_id ASC LIMIT 120`
    ).all<{ json: string }>();
    const produtos = estoque.results
      .map((r) => JSON.parse(r.json) as ProdutoShopee)
      .filter((p) => !vistos.has(p.itemId));

    if (produtos.length === 0) {
      if (erroAbastecer) throw erroAbastecer; // o n8n repete a chamada
      return json({ ok: false, motivo: 'estoque sem produto novo no momento' }, 200);
    }

    // Prefere produtos com desconto real informado pela Shopee (o post sai com DE/POR);
    // so cai nos sem desconto se o estoque nao tiver mais nenhum com desconto
    const comDesconto = produtos.filter(temDescontoReal);
    const candidatos = comDesconto.length > 0 ? comDesconto : produtos;

    // Varia o tipo: prefere um tipo que nao foi usado nos 3 ultimos posts
    const escolhido = candidatos.find((p) => !recentes.includes(tipoDe(p.productName))) ?? candidatos[0];
    const tipo = tipoDe(escolhido.productName);
    const texto = montaTexto(escolhido, tipo, escolhido.itemId);

    await env.DB.batch([
      env.DB.prepare(`UPDATE candidatos SET usado = 1 WHERE item_id = ?`).bind(escolhido.itemId),
      env.DB.prepare(`INSERT INTO posts (item_id, nome, tipo, preco, status) VALUES (?, ?, ?, ?, 'reservado')`).bind(
        escolhido.itemId,
        escolhido.productName.slice(0, 200),
        tipo,
        escolhido.price
      ),
    ]);

    return json({
      ok: true,
      itemId: escolhido.itemId,
      tipo,
      restantesNoEstoque: produtos.length - 1,
      texto,
      imagem: escolhido.imageUrl,
      link: escolhido.offerLink,
    });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Erro interno' }, 502);
  }
};
