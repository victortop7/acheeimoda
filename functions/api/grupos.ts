import type { Env } from '../lib/types';

// Gerenciamento dos grupos. Protegido por Authorization: Bearer ADMIN_SECRET.
// Usado pelo n8n para atualizar a contagem de membros e abrir/fechar grupos.

const LINK_CONVITE = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function autorizado(request: Request, env: Env): boolean {
  if (!env.ADMIN_SECRET) return false;
  const recebido = request.headers.get('Authorization') ?? '';
  const esperado = `Bearer ${env.ADMIN_SECRET}`;
  if (recebido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}

const inteiro = (v: unknown, min: number, max: number): number | null | 'invalido' => {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) return 'invalido';
  return v;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    const { results } = await env.DB.prepare(
      `SELECT g.id, g.nome, g.link, g.membros, g.limite, g.ativo, g.ordem,
              (SELECT COUNT(*) FROM cliques c WHERE c.grupo_id = g.id) AS cliques
       FROM grupos g ORDER BY g.ordem ASC, g.id ASC`
    ).all();
    return json({ grupos: results });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
};

// POST sem id cria; POST com id atualiza só os campos enviados
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const nome = typeof body.nome === 'string' ? body.nome.trim().slice(0, 80) : null;
    const link = typeof body.link === 'string' ? body.link.trim() : null;
    if (link !== null && !LINK_CONVITE.test(link)) {
      return json({ error: 'link deve ser um convite https://chat.whatsapp.com/...' }, 400);
    }

    const membros = inteiro(body.membros, 0, 5000);
    const limite = inteiro(body.limite, 1, 1024);
    const ordem = inteiro(body.ordem, 0, 100000);
    const ativo =
      body.ativo === undefined || body.ativo === null ? null : body.ativo === true || body.ativo === 1 ? 1 : 0;
    if (membros === 'invalido' || limite === 'invalido' || ordem === 'invalido') {
      return json({ error: 'membros, limite e ordem devem ser inteiros dentro da faixa' }, 400);
    }

    if (body.id === undefined || body.id === null) {
      if (!nome || !link) return json({ error: 'nome e link são obrigatórios para criar' }, 400);
      const criado = await env.DB.prepare(
        `INSERT INTO grupos (nome, link, membros, limite, ativo, ordem)
         VALUES (?, ?, COALESCE(?, 0), COALESCE(?, 950), COALESCE(?, 1), COALESCE(?, 0))
         RETURNING *`
      )
        .bind(nome, link, membros, limite, ativo, ordem)
        .first();
      return json({ grupo: criado }, 201);
    }

    const id = inteiro(body.id, 1, Number.MAX_SAFE_INTEGER);
    if (id === 'invalido' || id === null) return json({ error: 'id inválido' }, 400);

    const atualizado = await env.DB.prepare(
      `UPDATE grupos SET
         nome    = COALESCE(?, nome),
         link    = COALESCE(?, link),
         membros = COALESCE(?, membros),
         limite  = COALESCE(?, limite),
         ativo   = COALESCE(?, ativo),
         ordem   = COALESCE(?, ordem)
       WHERE id = ?
       RETURNING *`
    )
      .bind(nome, link, membros, limite, ativo, ordem, id)
      .first();

    if (!atualizado) return json({ error: 'grupo não encontrado' }, 404);
    return json({ grupo: atualizado });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
};
