// Horario de Brasilia (America/Sao_Paulo) e sorteio dos horarios de postagem do dia

const FUSO = 'America/Sao_Paulo';

export const JANELA_INICIO = 9 * 60; // 09:00
export const JANELA_FIM = 21 * 60; // 21:00
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

// Sorteia 1 ou 2 horarios dentro de CADA hora da janela, em minutos aleatorios.
// Os horarios mudam todo dia e nunca ficam colados (minimo de INTERVALO_MINIMO minutos entre dois posts).
export function sorteiaPorHora(inicio: number, fim: number): number[] {
  const todos: number[] = [];
  for (let bloco = Math.floor(inicio / 60) * 60; bloco < fim; bloco += 60) {
    const a = Math.max(bloco, inicio);
    const b = Math.min(bloco + 60, fim);
    const tamanho = b - a;
    if (tamanho < 15) continue;
    const quantidade = tamanho >= 45 && Math.random() < 0.5 ? 2 : 1;
    for (let i = 0; i < quantidade; i++) todos.push(a + Math.floor(Math.random() * tamanho));
  }
  todos.sort((x, y) => x - y);
  // Afasta posts que ficaram muito perto (inclusive entre uma hora e a seguinte)
  for (let i = 1; i < todos.length; i++) {
    if (todos[i] - todos[i - 1] < INTERVALO_MINIMO) todos[i] = todos[i - 1] + INTERVALO_MINIMO;
  }
  return todos.filter((m) => m < fim);
}
