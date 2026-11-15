// Horario de Brasilia (America/Sao_Paulo) e sorteio dos horarios de postagem do dia

const FUSO = 'America/Sao_Paulo';

export const JANELA_INICIO = 9 * 60; // 09:00
export const JANELA_FIM = 20 * 60 + 30; // 20:30
export const POSTS_POR_DIA = 4;
export const MAX_POSTS_DIA = 12; // trava de seguranca (inclui os testes manuais)

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

// Divide a janela em faixas iguais e sorteia um minuto no miolo (20% a 80%) de cada uma.
// Assim os horarios mudam todo dia, mas nunca ficam colados um no outro.
export function sorteiaHorarios(inicio: number, fim: number, quantidade: number): number[] {
  const tamanho = (fim - inicio) / quantidade;
  const saida: number[] = [];
  for (let i = 0; i < quantidade; i++) {
    const comeco = inicio + tamanho * i;
    saida.push(Math.floor(comeco + tamanho * (0.2 + Math.random() * 0.6)));
  }
  return saida;
}
