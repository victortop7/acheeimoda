import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';

// GET /api/post/historico : ultimos 30 produtos escolhidos (para acompanhar o teste)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, item_id, nome, tipo, preco, status, criado_em, enviado_em
       FROM posts ORDER BY id DESC LIMIT 30`
    ).all();
    return json({ posts: results });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
};
