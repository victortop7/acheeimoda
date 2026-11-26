// Horario de Brasilia (America/Sao_Paulo) e sorteio dos horarios de postagem do dia

const FUSO = 'America/Sao_Paulo';

export const JANELA_INICIO = 9 * 60; // 09:00
export const JANELA_FIM = 21 * 60; // 21:00
// Ritmo do dia: ate FIM_RITMO_ALTO (sabado da Black Friday, inclusive) o ritmo alto; depois, metade.
// A quantidade exata e sorteada dentro da faixa, e "teto" e a trava do dia (inclui testes manuais).
export const FIM_RITMO_ALTO = '2026-11-28';
export function ritmoDoDia(dia: string): { minimo: number; maximo: number; teto: number } {
  return dia <= FIM_RITMO_ALTO ? { minimo: 44, maximo: 50, teto: 50 } : { minimo: 22, maximo: 25, teto: 30 };
}
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

// Sorteia os horarios do dia. A quantidade vem do ritmo do dia e e repartida igualmente entre as horas;
// o que sobra vai para horas sorteadas. Cada hora e dividida em partes iguais e o minuto e sorteado dentro
// de cada parte, entao quantidade e horarios mudam todo dia e os posts nunca ficam colados.
export function sorteiaHorarios(inicio: number, fim: number, dia: string): number[] {
  const blocos: { a: number; b: number }[] = [];
  for (let bloco = Math.floor(inicio / 60) * 60; bloco < fim; bloco += 60) {
    const a = Math.max(bloco, inicio);
    const b = Math.min(bloco + 60, fim);
    if (b - a >= 15) blocos.push({ a, b });
  }
  if (blocos.length === 0) return [];

  const { minimo, maximo } = ritmoDoDia(dia);
  const doDiaInteiro = minimo + Math.floor(Math.random() * (maximo - minimo + 1));
  // Se o fluxo comecou no meio do dia, vale a proporcao do tempo que sobrou
  const minutosLivres = blocos.reduce((soma, x) => soma + (x.b - x.a), 0);
  const total = Math.max(1, Math.round((doDiaInteiro * minutosLivres) / (JANELA_FIM - JANELA_INICIO)));

  // Reparte: cada hora recebe a parte dela (proporcional ao tamanho) e as sobras sao sorteadas
  const cotas = blocos.map((x) => Math.floor((total * (x.b - x.a)) / minutosLivres));
  const ordem = blocos.map((_, i) => ({ i, sorte: Math.random() })).sort((x, y) => x.sorte - y.sorte);
  let sobra = total - cotas.reduce((soma, n) => soma + n, 0);
  for (let k = 0; sobra > 0; k++, sobra--) cotas[ordem[k % ordem.length].i]++;

  const todos: number[] = [];
  blocos.forEach(({ a, b }, i) => {
    const parte = (b - a) / cotas[i];
    for (let j = 0; j < cotas[i]; j++) todos.push(Math.floor(a + parte * (j + 0.1 + Math.random() * 0.8)));
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
