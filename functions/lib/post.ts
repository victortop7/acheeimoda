import type { ProdutoShopee } from './shopee';

// So entram produtos de moda; fora lingerie, itens de teste, avaria, esporte e termos delicados de anuncio
const INCLUIR =
  /(vestido|conjunto|cal[cç]a|blusa|cropped|saia|short|macac[aã]o|bolsa|jaqueta|casaco|camisa|regata|cardig[aã]n|biqu[ií]ni|kimono|colar|brinco|pulseira|[oó]culos|sand[aá]lia|rasteirinha|mochila|carteira|pochete|bon[eé]|len[cç]o|t[eê]nis|bota|sapato|rel[oó]gio)/i;
const EXCLUIR =
  /(sutiã|sutia|cinta|calcinha|modelador|emagrec|sensual|adesivo|teste|avaria|desapego|meia|lingerie|fio dental|body|pijam|dormir|fitness|academia|treino|masculin|infantil|beb[eê]|er[oó]tic)/i;

export type Tipo = 'vestido' | 'calca' | 'blusa' | 'saia_short' | 'macacao_conjunto' | 'bolsa' | 'acessorio' | 'calcado' | 'outro';

export function tipoDe(nome: string): Tipo {
  const n = nome.toLowerCase();
  if (/vestido/.test(n)) return 'vestido';
  if (/cal[cç]a/.test(n)) return 'calca';
  if (/(blusa|cropped|regata|camisa|cardig|jaqueta|casaco|kimono)/.test(n)) return 'blusa';
  if (/(saia|short)/.test(n)) return 'saia_short';
  if (/(macac|conjunto)/.test(n)) return 'macacao_conjunto';
  if (/(bolsa|mochila|carteira|pochete)/.test(n)) return 'bolsa';
  if (/(colar|brinco|pulseira|[oó]culos|bon[eé]|len[cç]o|rel[oó]gio)/.test(n)) return 'acessorio';
  if (/(sand[aá]lia|rasteirinha|t[eê]nis|bota|sapato)/.test(n)) return 'calcado';
  return 'outro';
}

// Desconto que a propria Shopee informa: abaixo de 10% nao chama atencao e acima de 80% costuma ser
// preco de referencia inflado pelo vendedor, entao nesses casos o post sai so com o preco atual
export function temDescontoReal(p: ProdutoShopee): boolean {
  return p.priceDiscountRate >= 10 && p.priceDiscountRate <= 80;
}

export function passaNoFiltro(p: ProdutoShopee): boolean {
  return (
    INCLUIR.test(p.productName) &&
    !EXCLUIR.test(p.productName) &&
    parseFloat(p.ratingStar) >= 4.6 &&
    p.sales >= 500 &&
    !!p.offerLink &&
    !!p.imageUrl
  );
}

// Ganchos neutros por tipo: sem promessa de resultado no corpo e sem afirmacao que nao dependa do produto
const GANCHOS: Record<Tipo, string[]> = {
  vestido: [
    'O VESTIDO QUE RESOLVE O LOOK SEM ESFORÇO',
    'PRA QUEM QUER FICAR ARRUMADA SEM COMPLICAÇÃO',
    'UM VESTIDO PRA CADA OCASIÃO DA SEMANA',
    'O VESTIDO QUE VAI DO DIA PRA NOITE',
  ],
  calca: [
    'A CALÇA QUE FICA BEM EM QUALQUER LOOK',
    'CONFORTO E ESTILO NA MESMA PEÇA',
    'A CALÇA QUE VOCÊ VAI QUERER USAR TODA SEMANA',
    'UMA BASE PRA MONTAR VÁRIOS LOOKS',
  ],
  blusa: [
    'A PEÇA BÁSICA QUE COMBINA COM TUDO',
    'FRESQUINHA PRO CALOR',
    'MONTA LOOK EM DOIS MINUTOS',
    'AQUELA PEÇA CORINGA DO GUARDA-ROUPA',
  ],
  saia_short: [
    'PRA SAIR DA ROTINA SEM PENSAR MUITO',
    'LEVE, CONFORTÁVEL E COM ESTILO',
    'O TOQUE QUE FALTAVA NO SEU LOOK',
    'UMA PEÇA, VÁRIAS COMBINAÇÕES',
  ],
  macacao_conjunto: [
    'O LOOK PRONTO EM UM MINUTO',
    'VESTIU E JÁ ESTÁ PRONTA',
    'CONJUNTO PRA QUEM NÃO TEM TEMPO A PERDER',
    'UMA PEÇA SÓ E O LOOK ESTÁ FEITO',
  ],
  bolsa: [
    'A BOLSA QUE COMBINA COM VÁRIOS LOOKS',
    'PRÁTICA PRO DIA A DIA',
    'O ACESSÓRIO QUE FECHA O LOOK',
    'ESPAÇO E ESTILO NA MESMA BOLSA',
  ],
  acessorio: [
    'O DETALHE QUE MUDA O LOOK',
    'ACESSÓRIO PRA COMPLETAR A PRODUÇÃO',
    'UM TOQUE FINAL NO SEU LOOK',
    'PEQUENO DETALHE, GRANDE DIFERENÇA',
  ],
  calcado: [
    'PRA CAMINHAR COM ESTILO',
    'O CALÇADO QUE COMBINA COM VÁRIOS LOOKS',
    'CONFORTO PRO DIA INTEIRO',
    'O PAR QUE FALTAVA NA SUA COLEÇÃO',
  ],
  outro: [
    'ACHADO DE MODA DO DIA',
    'MAIS UM ACHADO PRA SEU GUARDA-ROUPA',
    'OLHA O QUE A GENTE ACHOU PRA VOCÊ',
    'SELECIONADO PELA NOTA E PELAS VENDAS',
  ],
};

const GANCHOS_EXTRAS: Record<Tipo, string[]> = {
  vestido: [
    'PRA CAPRICHAR NO LOOK DO FIM DE SEMANA',
    'O VESTIDO QUE COMBINA COM VÁRIOS ACESSÓRIOS',
    'LEVE E CONFORTÁVEL PRO DIA A DIA',
    'PRA QUEM AMA UM LOOK QUE JÁ VEM PRONTO',
  ],
  calca: [
    'CALÇA PRA FICAR CONFORTÁVEL SEM PERDER O ESTILO',
    'PRA MONTAR LOOK COM BLUSA, CAMISA OU CROPPED',
    'A CALÇA QUE COMBINA COM O SEU GUARDA-ROUPA',
    'UM CORINGA PRA SEMANA TODA',
  ],
  blusa: [
    'PRA COMBINAR COM CALÇA, SAIA OU SHORT',
    'LEVE PRA OS DIAS QUENTES',
    'O BÁSICO QUE NUNCA SAI DE MODA',
    'MAIS UM ITEM CORINGA PRA SUA COLEÇÃO',
  ],
  saia_short: [
    'PRA SAIR COM LOOK LEVE E FRESCO',
    'COMBINA COM BLUSA, CROPPED OU CAMISA',
    'DAQUELAS PEÇAS QUE SALVAM O LOOK',
    'ESTILO E PRATICIDADE NA MESMA PEÇA',
  ],
  macacao_conjunto: [
    'DAQUELE LOOK QUE NÃO PRECISA PENSAR',
    'PRATICIDADE PRA CORRERIA DO DIA A DIA',
    'O CONJUNTO QUE JÁ VEM COMBINADO',
    'PRA QUEM QUER FICAR ARRUMADA RÁPIDO',
  ],
  bolsa: [
    'PRA LEVAR O ESSENCIAL COM ESTILO',
    'A BOLSA QUE COMPLETA O LOOK',
    'PRÁTICA E COMBINA COM TUDO',
    'UM ACESSÓRIO QUE FAZ DIFERENÇA',
  ],
  acessorio: [
    'PRA DAR UM TOQUE DE ESTILO NO LOOK',
    'O ACESSÓRIO QUE CHAMA ATENÇÃO',
    'DETALHE QUE COMPLETA A PRODUÇÃO',
    'ACHADO PRA COMPLETAR O LOOK',
  ],
  calcado: [
    'PRA CAMINHAR COM CONFORTO E ESTILO',
    'COMBINA COM VÁRIOS LOOKS',
    'O PAR QUE VAI BEM COM TUDO',
    'ACHADO PRA QUEM AMA UM BOM CALÇADO',
  ],
  outro: [
    'MAIS UM ACHADO DE MODA PRA VOCÊ',
    'OLHA ESSA OPÇÃO PRA RENOVAR O GUARDA-ROUPA',
    'SELEÇÃO DO DIA: MODA FEMININA',
    'ACHADINHO COM BOA NOTA E MUITAS VENDAS',
  ],
};

export function escolheGancho(tipo: Tipo, semente: number): string {
  const lista = [...GANCHOS[tipo], ...GANCHOS_EXTRAS[tipo]];
  return lista[Math.abs(semente) % lista.length];
}

const reais = (v: string | number): string => 'R$ ' + parseFloat(String(v)).toFixed(2).replace('.', ',');

function vendasLegivel(n: number): string {
  if (n < 1000) return `${n}`;
  const k = (n / 1000).toFixed(1).replace('.', ',').replace(',0', '');
  return `${k} mil`;
}

export function nomeLimpo(titulo: string): string {
  let s = titulo.replace(/[|\\/]+/g, ' ').replace(/\s+/g, ' ').trim();
  const letras = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const maiusculas = letras.replace(/[^A-ZÀ-Ý]/g, '').length;
  if (letras.length > 0 && maiusculas / letras.length > 0.6) {
    s = s.toLowerCase();
  }
  if (s.length > 62) s = s.slice(0, 62).replace(/\s+\S*$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Dados prontos para a vitrine da landing (mesmo criterio de preco dos posts: o "De" so aparece com desconto real)
export interface ItemVitrine {
  nome: string;
  imagem: string;
  link: string;
  de: string | null;
  rotulo: string;
  valor: string;
  nota: string;
  vendas: string;
}

export function itemVitrine(p: ProdutoShopee): ItemVitrine {
  const varia = p.priceMin !== p.priceMax;
  const valor = varia ? p.priceMin : p.price;
  const original = parseFloat(valor) / (1 - p.priceDiscountRate / 100);
  return {
    nome: nomeLimpo(p.productName),
    imagem: p.imageUrl,
    link: p.offerLink,
    de: temDescontoReal(p) ? reais(original) : null,
    rotulo: varia ? 'A PARTIR DE' : 'POR',
    valor: reais(valor),
    nota: parseFloat(p.ratingStar).toFixed(1),
    vendas: vendasLegivel(p.sales),
  };
}

export function montaTexto(p: ProdutoShopee, tipo: Tipo, semente: number): string {
  const varia = p.priceMin !== p.priceMax;
  const desc = p.priceDiscountRate;
  // O "De" so aparece quando a propria Shopee informa um desconto real (nunca inventamos um)
  const mostraDe = temDescontoReal(p);
  const valor = varia ? p.priceMin : p.price;
  const rotulo = varia ? 'A PARTIR DE' : 'POR';
  // A Shopee nao envia o preco original: ele e calculado pelo desconto informado (preco / (1 - desconto))
  const original = parseFloat(valor) / (1 - desc / 100);
  const linhaPreco = mostraDe
    ? `🔥 DE ~${reais(original)}~ | ${rotulo} *${reais(valor)}*`
    : `🔥 ${rotulo} *${reais(valor)}*`;
  return [
    escolheGancho(tipo, semente),
    '',
    `✅ ${nomeLimpo(p.productName)}`,
    '',
    linhaPreco,
    `⭐ ${parseFloat(p.ratingStar).toFixed(1)} · ${vendasLegivel(p.sales)} vendidos`,
    '',
    `🔗 ${p.offerLink}`,
    '',
    '#Publi',
  ].join('\n');
}
