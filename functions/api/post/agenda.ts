import type { Env } from '../../lib/types';
import { autorizado, json } from '../../lib/auth';
import { JANELA_FIM, JANELA_INICIO, agoraSP, hhmm, quantidadeParaJanela, sorteiaHorarios } from '../../lib/horario';

// POST /api/post/agenda
// Devolve os horarios de postagem de hoje que ainda nao passaram, com a espera em segundos.
// Na primeira chamada do dia, sorteia POSTS_POR_DIA horarios espalhados entre 09:00 e 21:00 (Brasilia),
// guarda, e as chamadas seguintes devolvem os mesmos.
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
      const horarios = sorteiaHorarios(inicio, JANELA_FIM, quantidadeParaJanela(inicio, JANELA_FIM)).map(hhmm);
      if (horarios.length > 0) {
        await env.DB.batch(
          horarios.map((h) => env.DB.prepare(`INSERT OR IGNORE INTO agenda (dia, horario) VALUES (?, ?)`).bind(dia, h))
        );
      }
      lista = horarios;
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
