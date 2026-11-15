import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';
import { buscarModaFeminina } from '../../lib/shopee';
import { montaTexto, passaNoFiltro, tipoDe } from '../../lib/post';
import { MAX_POSTS_DIA, agoraSP } from '../../lib/horario';

// POST /api/post/proximo
// Escolhe o proximo produto de moda feminina (que ainda nao foi postado) e devolve o texto pronto.
// Quem envia ao WhatsApp e o n8n; depois do envio ele chama /api/post/confirmar.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    // Trava de seguranca: nunca mais que MAX_POSTS_DIA por dia (inclui testes manuais)
    const { dia } = agoraSP();
    const hoje = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM posts WHERE date(criado_em, '-3 hours') = ?`
    )
      .bind(dia)
      .first<{ total: number }>();
    if ((hoje?.total ?? 0) >= MAX_POSTS_DIA) {
      return json({ ok: false, motivo: `limite diario de ${MAX_POSTS_DIA} posts atingido` }, 200);
    }

    const vistosRes = await env.DB.prepare(
      `SELECT item_id FROM posts WHERE criado_em >= datetime('now', '-60 days')`
    ).all<{ item_id: number }>();
    const vistos = new Set<number>(vistosRes.results.map((r) => r.item_id));

    const recentesRes = await env.DB.prepare(`SELECT tipo FROM posts ORDER BY id DESC LIMIT 3`).all<{ tipo: string }>();
    const recentes = recentesRes.results.map((r) => r.tipo);

    // Percorre as paginas da Shopee ate achar candidatos novos (maximo 5 paginas)
    for (let pagina = 1; pagina <= 5; pagina++) {
      const produtos = await buscarModaFeminina(env, pagina);
      const novos = produtos.filter((p) => passaNoFiltro(p) && !vistos.has(p.itemId));
      if (novos.length === 0) continue;

      // Varia o tipo: prefere um tipo que nao foi usado nos 3 ultimos posts
      const escolhido = novos.find((p) => !recentes.includes(tipoDe(p.productName))) ?? novos[0];
      const tipo = tipoDe(escolhido.productName);
      const texto = montaTexto(escolhido, tipo, escolhido.itemId);

      await env.DB.prepare(
        `INSERT INTO posts (item_id, nome, tipo, preco, status) VALUES (?, ?, ?, ?, 'reservado')`
      )
        .bind(escolhido.itemId, escolhido.productName.slice(0, 200), tipo, escolhido.price)
        .run();

      return json({
        ok: true,
        itemId: escolhido.itemId,
        tipo,
        pagina,
        texto,
        imagem: escolhido.imageUrl,
        link: escolhido.offerLink,
      });
    }

    return json({ ok: false, motivo: 'nenhum produto novo passou no filtro nas 5 primeiras paginas' }, 200);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Erro interno' }, 502);
  }
};
