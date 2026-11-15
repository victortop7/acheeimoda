import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';

// POST /api/post/confirmar  { itemId, messageId }
// O n8n chama depois que o WhatsApp aceitou a mensagem. Marca o produto como enviado.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    const corpo = (await request.json()) as { itemId?: unknown; messageId?: unknown };
    if (typeof corpo.itemId !== 'number' || !Number.isInteger(corpo.itemId)) {
      return json({ error: 'itemId deve ser um numero inteiro' }, 400);
    }
    const messageId = typeof corpo.messageId === 'string' ? corpo.messageId.slice(0, 80) : null;

    const r = await env.DB.prepare(
      `UPDATE posts SET status = 'enviado', message_id = ?, enviado_em = datetime('now')
       WHERE item_id = ? AND status = 'reservado'`
    )
      .bind(messageId, corpo.itemId)
      .run();

    return json({ ok: true, atualizados: r.meta.changes ?? 0 });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
};
