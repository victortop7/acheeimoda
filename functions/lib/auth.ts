import type { Env } from './types';

// Compara o cabecalho Authorization com "Bearer <ADMIN_SECRET>" em tempo constante
export function autorizado(request: Request, env: Env): boolean {
  if (!env.ADMIN_SECRET) return false;
  const recebido = request.headers.get('Authorization') ?? '';
  const esperado = `Bearer ${env.ADMIN_SECRET}`;
  if (recebido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
