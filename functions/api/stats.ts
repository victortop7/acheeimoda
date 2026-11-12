import type { Env } from '../lib/types';

// Público: devolve só números agregados (sem dados de ninguém).
//  - membros: soma dos grupos
//  - vagas: vagas restantes no grupo que o /go usaria agora (null se não houver grupo com vaga)
// Os números são tão reais quanto a coluna "membros", que o n8n deve manter atualizada.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60',
  };
  try {
    const total = await env.DB.prepare(
      'SELECT COALESCE(SUM(membros), 0) AS total FROM grupos'
    ).first<{ total: number }>();

    const atual = await env.DB.prepare(
      `SELECT (limite - membros) AS vagas FROM grupos
       WHERE ativo = 1 AND membros < limite
       ORDER BY ordem ASC, id ASC
       LIMIT 1`
    ).first<{ vagas: number }>();

    return new Response(
      JSON.stringify({ membros: total?.total ?? 0, vagas: atual?.vagas ?? null }),
      { headers }
    );
  } catch {
    return new Response(JSON.stringify({ membros: 0, vagas: null }), { headers });
  }
};
