import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';
import { JANELA_FIM, JANELA_INICIO, POSTS_POR_DIA, agoraSP, hhmm, sorteiaHorarios } from '../../lib/horario';

// POST /api/post/agenda
// Devolve os horarios de postagem de hoje que ainda nao passaram, com a espera em segundos.
// Na primeira chamada do dia, sorteia os horarios e guarda (chamadas seguintes devolvem os mesmos).
// Teste: ?agora=08:55 simula esse horario (so para conferir o sorteio; nao use em producao).
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!autorizado(request, env)) return json({ error: 'Unauthorized' }, 401);
  try {
    const real = agoraSP();
    const simulado = new URL(request.url).searchParams.get('agora');
    let minutos = real.minutos;
    let segundos = real.segundos;
    if (simulado && /^\d{2}:\d{2}$/.test(simulado)) {
      minutos = parseInt(simulado.slice(0, 2), 10) * 60 + parseInt(simulado.slice(3, 5), 10);
      segundos = 0;
    }
    const dia = simulado ? `teste-${real.dia}` : real.dia;

    const existentes = await env.DB.prepare(`SELECT horario FROM agenda WHERE dia = ? ORDER BY horario`)
      .bind(dia)
      .all<{ horario: string }>();
    let lista = existentes.results.map((r) => r.horario);

    if (lista.length === 0) {
      // Se a primeira chamada vier no meio do dia, sorteia so no que sobrou da janela
      const inicio = Math.max(JANELA_INICIO, minutos + 10);
      const restante = JANELA_FIM - inicio;
      const quantidade =
        restante >= 60 ? Math.max(1, Math.round((POSTS_POR_DIA * restante) / (JANELA_FIM - JANELA_INICIO))) : 0;
      const horarios = sorteiaHorarios(inicio, JANELA_FIM, quantidade).map(hhmm);
      for (const h of horarios) {
        await env.DB.prepare(`INSERT OR IGNORE INTO agenda (dia, horario) VALUES (?, ?)`).bind(dia, h).run();
      }
      lista = horarios.sort();
    }

    const horarios = lista
      .map((h) => {
        const alvo = (parseInt(h.slice(0, 2), 10) * 60 + parseInt(h.slice(3, 5), 10)) * 60;
        return { horario: h, espera: alvo - (minutos * 60 + segundos) };
      })
      .filter((x) => x.espera >= 1);

    return json({ ok: true, dia, total: lista.length, horarios });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
};
