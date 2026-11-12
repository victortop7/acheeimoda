import type { Env } from './lib/types';

interface Grupo {
  id: number;
  link: string;
}

const cortar = (v: string | null): string | null => (v ? v.slice(0, 100) : null);

const paginaLotado = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Grupos lotados</title>
<style>body{font-family:system-ui,sans-serif;background:#f7f2ec;color:#2a2320;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}
main{max-width:420px}h1{font-size:22px;margin:0 0 12px}p{line-height:1.5;color:#6e625b}a{color:#9c4a3c}</style></head>
<body><main><h1>Estamos abrindo novas vagas</h1>
<p>Todos os grupos estão cheios neste momento. Tente de novo em alguns minutos.</p>
<p><a href="/">Voltar</a></p></main></body></html>`;

// GET /go : escolhe o primeiro grupo com vaga e redireciona para o convite
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;

    const grupo = await env.DB.prepare(
      `SELECT id, link FROM grupos
       WHERE ativo = 1 AND membros < limite
       ORDER BY ordem ASC, id ASC
       LIMIT 1`
    ).first<Grupo>();

    if (!grupo) {
      return new Response(paginaLotado, {
        status: 503,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': '120',
        },
      });
    }

    const url = new URL(request.url);
    context.waitUntil(
      env.DB.prepare(
        `INSERT INTO cliques (grupo_id, utm_source, utm_medium, utm_campaign)
         VALUES (?, ?, ?, ?)`
      )
        .bind(
          grupo.id,
          cortar(url.searchParams.get('utm_source')),
          cortar(url.searchParams.get('utm_medium')),
          cortar(url.searchParams.get('utm_campaign'))
        )
        .run()
        .catch(() => undefined)
    );

    return new Response(null, {
      status: 302,
      headers: { Location: grupo.link, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};
