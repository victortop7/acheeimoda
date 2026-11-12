import type { Env } from '../lib/types';

// Público: só devolve o total de membros somado dos grupos (sem dados de ninguém).
// O número é tão real quanto a coluna "membros", que o n8n deve manter atualizada.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=300',
  };
  try {
    const row = await env.DB.prepare(
      'SELECT COALESCE(SUM(membros), 0) AS total FROM grupos'
    ).first<{ total: number }>();
    return new Response(JSON.stringify({ membros: row?.total ?? 0 }), { headers });
  } catch {
    return new Response(JSON.stringify({ membros: 0 }), { headers });
  }
};
