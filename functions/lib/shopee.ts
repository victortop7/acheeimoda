import type { Env } from './types';

const ENDPOINT = 'https://open-api.affiliate.shopee.com.br/graphql';

export interface ProdutoShopee {
  itemId: number;
  productName: string;
  price: string;
  priceMin: string;
  priceMax: string;
  priceDiscountRate: number;
  ratingStar: string;
  sales: number;
  imageUrl: string;
  productLink: string;
  offerLink: string;
}

async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const dormir = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface RespostaGraphQL<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: number } }>;
}

// A API da Shopee oscila: o erro 10000 ("System Error") aparece e some na tentativa seguinte.
// Por isso repetimos ate 6 vezes, assinando de novo a cada tentativa (o horario faz parte da assinatura).
export async function shopeeQuery<T>(env: Env, query: string, tentativas = 6): Promise<T> {
  let ultimoErro = 'sem resposta';
  for (let i = 1; i <= tentativas; i++) {
    const payload = JSON.stringify({ query });
    const ts = Math.floor(Date.now() / 1000);
    const assinatura = await sha256Hex(`${env.SHOPEE_APP_ID}${ts}${payload}${env.SHOPEE_SECRET}`);

    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SHA256 Credential=${env.SHOPEE_APP_ID}, Timestamp=${ts}, Signature=${assinatura}`,
      },
      body: payload,
    });

    let corpo: RespostaGraphQL<T> | null = null;
    try {
      corpo = (await resp.json()) as RespostaGraphQL<T>;
    } catch {
      corpo = null;
    }

    if (corpo && !corpo.errors && corpo.data) return corpo.data;

    const erro = corpo?.errors?.[0];
    ultimoErro = erro ? erro.message : `HTTP ${resp.status}`;
    const transitorio = !erro || erro.extensions?.code === 10000;
    if (!transitorio) break;
    await dormir(600 * i);
  }
  throw new Error(`Shopee: ${ultimoErro}`);
}

const CAMPOS = 'itemId productName price priceMin priceMax priceDiscountRate ratingStar sales imageUrl productLink offerLink';

// Moda feminina (categoria 100017), mais vendidos primeiro
export async function buscarModaFeminina(env: Env, pagina: number): Promise<ProdutoShopee[]> {
  const dados = await shopeeQuery<{ productOfferV2: { nodes: ProdutoShopee[] } }>(
    env,
    `{ productOfferV2(productCatId:100017, listType:0, sortType:2, page:${pagina}, limit:50){ nodes{ ${CAMPOS} } } }`
  );
  return dados.productOfferV2.nodes;
}
