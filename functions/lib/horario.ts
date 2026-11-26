// Horario de Brasilia (America/Sao_Paulo) e sorteio dos horarios de postagem do dia

const FUSO = 'America/Sao_Paulo';

export const JANELA_INICIO = 9 * 60; // 09:00
export const JANELA_FIM = 21 * 60; // 21:00
export const POSTS_POR_HORA = 2; // posts em cada hora da janela
export const HORAS_COM_EXTRA = 2; // horas sorteadas por dia que recebem 3 posts (total: 26 por dia)
export const MAX_POSTS_DIA = 30; // trava de seguranca (inclui os testes manuais)
export const INTERVALO_MINIMO = 8; // minutos entre dois posts

export interface AgoraSP {
  dia: string; // AAAA-MM-DD
  minutos: number; // minutos desde 00:00
  segundos: number;
}

export function agoraSP(): AgoraSP {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pega = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? '00';
  let hora = parseInt(pega('hour'), 10);
  if (hora === 24) hora = 0;
  return {
    dia: `${pega('year')}-${pega('month')}-${pega('day')}`,
    minutos: hora * 60 + parseInt(pega('minute'), 10),
    segundos: parseInt(pega('second'), 10),
  };
}

export const hhmm = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Sorteia os horarios do dia: POSTS_POR_HORA em cada hora da janela e, em HORAS_COM_EXTRA horas
// escolhidas por sorteio, um post a mais. Cada hora e dividida em partes iguais e o minuto e sorteado
// dentro de cada parte, entao os horarios mudam todo dia e nunca ficam colados.
export function sorteiaHorarios(inicio: number, fim: number): number[] {
  const blocos: { a: number; b: number }[] = [];
  for (let bloco = Math.floor(inicio / 60) * 60; bloco < fim; bloco += 60) {
    const a = Math.max(bloco, inicio);
    const b = Math.min(bloco + 60, fim);
    if (b - a >= 15) blocos.push({ a, b });
  }

  // Sorteia quais horas cheias ganham o post extra
  const cheias = blocos.map((x, i) => (x.b - x.a === 60 ? i : -1)).filter((i) => i >= 0);
  const comExtra = new Set<number>();
  while (comExtra.size < Math.min(HORAS_COM_EXTRA, cheias.length)) {
    comExtra.add(cheias[Math.floor(Math.random() * cheias.length)]);
  }

  const todos: number[] = [];
  blocos.forEach(({ a, b }, i) => {
    const meta = POSTS_POR_HORA + (comExtra.has(i) ? 1 : 0);
    // Hora incompleta (o fluxo comecou no meio dela) recebe posts na proporcao do tempo que sobrou
    const quantidade = Math.max(1, Math.round((meta * (b - a)) / 60));
    const parte = (b - a) / quantidade;
    for (let j = 0; j < quantidade; j++) todos.push(Math.floor(a + parte * (j + 0.1 + Math.random() * 0.8)));
  });

  // Garante o intervalo minimo, inclusive entre uma hora e a seguinte, sem passar do fim da janela
  for (let i = 1; i < todos.length; i++) {
    if (todos[i] - todos[i - 1] < INTERVALO_MINIMO) todos[i] = todos[i - 1] + INTERVALO_MINIMO;
  }
  for (let i = todos.length - 1; i >= 0; i--) {
    const teto = i === todos.length - 1 ? fim - 1 : todos[i + 1] - INTERVALO_MINIMO;
    if (todos[i] > teto) todos[i] = teto;
  }
  return todos.filter((m) => m >= inicio);
}
