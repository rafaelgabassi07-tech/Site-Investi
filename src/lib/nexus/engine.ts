import { z } from 'zod';
import yahooFinanceRaw from 'yahoo-finance2';
const yahooFinance = yahooFinanceRaw as any;

// ════════════════════════════════════════════════════════════════════════════
// 1. TIPAGENS E CONTRATOS
// ════════════════════════════════════════════════════════════════════════════

export interface GenericRule {
  name: string;
  anchors: string[];
  extractRegex: RegExp;
  formatter?: (raw: string) => any;
  /**
   * Se true, extrai todos os matches no chunk como array.
   * Útil para tabelas de dividendos, histórico, etc.
   */
  multiple?: boolean;
}

export interface ExtractorTemplate<T = any> {
  name: string;
  rules: GenericRule[];
  schema: z.ZodSchema<T>;
}

export interface ScrapeSource<T = any> {
  url: string;
  template: ExtractorTemplate<T>;
  requireStealth?: boolean;
}

export type ExtendedAssetType = 'ACAO' | 'FII' | 'BDR' | 'ETF' | 'STOCK' | 'CRYPTO';

export interface NewsItem {
  title: string;
  link: string;
  pubDate?: Date;
  source?: string;
}

export interface NexusEngineOptions {
  cacheTtlMs?: number;
  cacheStaleMs?: number;
  maxRetries?: number;
  retryBaseDelay?: number;
  fetchTimeoutMs?: number;
  concurrencyLimit?: number;
  domainRps?: number;
  domainBurst?: number;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. CONSTANTES PRÉ-COMPILADAS DE MÓDULO
// ════════════════════════════════════════════════════════════════════════════

const RE_MOEDA   = /[R$\s]/g;
const RE_MILHAR  = /\./g;
const RE_DECIMAL = /,/;
const RE_SA      = /\.SA$/i;
const RE_BDR     = /3[2-5]$/;
const RE_TICKER  = /^[A-Z0-9\.\-=^]{2,20}$/;

export const VALORES_INVALIDOS = new Set([
  '-', '—', '–', 'N/A', 'n/a', 'nd', '', 'null', 'undefined',
  '--', '---', '--%', '0%',
]);

/**
 * FIX #1 — User-Agents atualizados para Chrome 131+ e Firefox 133+.
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

/**
 * FIX #2 — ETFs B3 conhecidos.
 */
const ETFS_CONHECIDOS = new Set([
  'BOVA11','IVVB11','SMAL11','DIVO11','FIND11','MATB11','GOVE11','XFIX11',
  'GOLD11','SPXI11','HASH11','BOVB11','BOVS11','BRAP11','BRRJ11','BRAX11',
  'XINA11','EURP11','FIXA11','TCHE11','ECOO11','ACWI11','NASD11',
  'USTK11','NSDQ11','DEFI11','ESGE11','SUST11','AGRI11','IFRA11',
  'BDIV11','BLKB11','BNDX11','BOVV11','BRCO11','CSMO11','VALE11','QUAL11',
  'REIT11','TRET11','WRLD11','XBOV11','PIBB11','SMAC11','MOAT11','PORD11',
]);


function safeParse(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    return parseFloat(v.replace('%', '').replace(',', '.')) || 0;
  }
  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// 3. GUARD: process.cpuUsage (Node-specific)
// ════════════════════════════════════════════════════════════════════════════

const hasCpuUsage = typeof process !== 'undefined' && typeof (process as any).cpuUsage === 'function';
function safeCpuStart(): any | null { return hasCpuUsage ? (process as any).cpuUsage() : null; }
function safeCpuDeltaMs(start: any | null): number {
  if (!start || !hasCpuUsage) return 0;
  const d = (process as any).cpuUsage(start);
  return (d.user + d.system) / 1000;
}

// ════════════════════════════════════════════════════════════════════════════
// 4. UTILITÁRIOS
// ════════════════════════════════════════════════════════════════════════════

export function normalizeBRNumber(raw: string): number | string {
  if (!raw) return '';
  let limpo = raw.replace(RE_MOEDA, '').toUpperCase().trim();
  if (limpo.includes('%')) return limpo;

  let mult = 1;
  const ult = limpo[limpo.length - 1];
  if      (ult === 'K') { mult = 1_000;         limpo = limpo.slice(0, -1); }
  else if (ult === 'M') { mult = 1_000_000;     limpo = limpo.slice(0, -1); }
  else if (ult === 'B') { mult = 1_000_000_000; limpo = limpo.slice(0, -1); }

  limpo = limpo.replace(RE_MILHAR, '').replace(RE_DECIMAL, '.');
  const num = parseFloat(limpo);
  return isNaN(num) ? raw.trim() : num * mult;
}

export function inferAssetType(ticker: string): ExtendedAssetType {
  const clean = canonicalizeTicker(ticker);
  if (RE_BDR.test(clean)) return 'BDR';
  if (clean.endsWith('11')) return ETFS_CONHECIDOS.has(clean) ? 'ETF' : 'FII';
  if (clean.endsWith('12')) return 'FII';
  return 'ACAO';
}

export function canonicalizeTicker(raw: string): string {
  return raw.trim().replace(/\s+/g, '').replace(RE_SA, '').toUpperCase();
}

export async function fetchNews(ticker: string): Promise<NewsItem[]> {
  return NexusEngine.fetchNews(ticker);
}

function validarTicker(clean: string): string | null {
  if (!clean) return 'Ticker vazio';
  const marketTickers = ['^BVSP', '^GSPC', 'USDBRL=X', 'BTC-USD'];
  if (marketTickers.includes(clean)) return null;
  if (!RE_TICKER.test(clean)) return `Formato inválido: "${clean}"`;
  return null;
}

function getRandomAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function backoffMs(attempt: number, base = 500, cap = 16_000): number {
  return Math.random() * Math.min(cap, base * 2 ** attempt);
}

// ════════════════════════════════════════════════════════════════════════════
// 5. LRU CACHE
// ════════════════════════════════════════════════════════════════════════════

class LRUCache<V> {
  private mapa = new Map<string, { data: V; expiresAt: number; staleAt: number }>();
  constructor(private maxSize: number) {
    if (maxSize < 1) throw new RangeError('LRUCache: maxSize deve ser >= 1');
  }

  get(key: string): { data: V; isStale: boolean } | null {
    const entry = this.mapa.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.mapa.delete(key);
      return null;
    }

    this.mapa.delete(key);
    this.mapa.set(key, entry);
    return { data: entry.data, isStale: now > entry.staleAt };
  }

  set(key: string, data: V, staleMs: number, ttlMs: number): void {
    if (this.mapa.has(key)) this.mapa.delete(key);
    else if (this.mapa.size >= this.maxSize) this.mapa.delete(this.mapa.keys().next().value!);

    const now = Date.now();
    this.mapa.set(key, { data, staleAt: now + staleMs, expiresAt: now + ttlMs });
  }

  delete(key: string): boolean { return this.mapa.delete(key); }
  clear(): void                { this.mapa.clear(); }
  get tamanho(): number        { return this.mapa.size; }
  get tamanhoMax(): number     { return this.maxSize; }
}

// ════════════════════════════════════════════════════════════════════════════
// 6. CIRCUIT BREAKER
// ════════════════════════════════════════════════════════════════════════════

class DomainRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly rps: number = 2,
    private readonly burst: number = 5
  ) {
    this.tokens = burst;
    this.lastRefill = performance.now();
  }

  async acquire(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private refill(): void {
    const now = performance.now();
    const elapsedMs = now - this.lastRefill;
    const newTokens = elapsedMs * (this.rps / 1000);
    
    if (newTokens > 0) {
      this.tokens = Math.min(this.burst, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }
}

type CBState = 'FECHADO' | 'ABERTO' | 'SEMI_ABERTO';

class CircuitBreaker {
  private state: CBState = 'FECHADO';
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private threshold: number = 3,
    private resetMs:   number = 30_000,
  ) {}

  getState(): CBState { return this.state; }

  isOpen(): boolean {
    if (this.state === 'ABERTO') {
      if (Date.now() - this.lastFailureTime > this.resetMs) {
        this.state = 'SEMI_ABERTO';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    if (this.state === 'SEMI_ABERTO') {
      this.successCount++;
      if (this.successCount >= 2) this.reset();
    } else {
      this.failures = 0;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    if (this.failures >= this.threshold) this.state = 'ABERTO';
  }

  reset(): void {
    this.state    = 'FECHADO';
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  getFalhas(): number { return this.failures; }
}

// ════════════════════════════════════════════════════════════════════════════
// 7. STEALTH HEADERS
// ════════════════════════════════════════════════════════════════════════════

const _hostnameCache = new Map<string, string>();

function extractHostname(url: string): string {
  const match = url.match(/^https?:\/\/[^\/]+/);
  const origin = match ? match[0] : url;
  let h = _hostnameCache.get(origin);
  if (h) return h;
  try { h = new URL(url).hostname; } catch { h = url; }
  if (_hostnameCache.size >= 64) _hostnameCache.delete(_hostnameCache.keys().next().value!);
  _hostnameCache.set(origin, h);
  return h;
}

function getStealthHeaders(url: string): Record<string, string> {
  const hostname = extractHostname(url);
  const lang = Math.random() > 0.5
    ? 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    : 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3';

  return {
    'User-Agent'               : getRandomAgent(),
    'Accept'                   : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language'          : lang,
    'Accept-Encoding'          : 'gzip, deflate, br',
    'Cache-Control'            : 'no-cache',
    'Pragma'                   : 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'DNT'                      : '1',
    'Referer'                  : hostname.includes('statusinvest') ? 'https://www.google.com/' : `https://${hostname}/`,
    'Sec-Fetch-Dest'           : 'document',
    'Sec-Fetch-Mode'           : 'navigate',
    'Sec-Fetch-Site'           : 'none',
    'Sec-Fetch-User'           : '?1',
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 8. UNIVERSAL LEXER
// ════════════════════════════════════════════════════════════════════════════

const _regexCache = new Map<string, RegExp>();

function getGlobalRegex(source: string): RegExp {
  let r = _regexCache.get(source);
  if (!r) {
    r = new RegExp(source, 'g');
    _regexCache.set(source, r);
  }
  r.lastIndex = 0;
  return r;
}

export function universalLexer<T = any>(
  html: string,
  template: ExtractorTemplate<T>,
  existingResults: Partial<T> = {},
): Partial<T> {
  const results: any = { ...existingResults };
  const htmlLower = html.toLowerCase();

  for (const rule of template.rules) {
    if (results[rule.name] !== undefined && !rule.multiple) continue;

    for (const anchor of rule.anchors) {
      const anchorLower = anchor.toLowerCase();
      let idx = htmlLower.indexOf(`>${anchorLower}<`);
      if (idx === -1) idx = htmlLower.indexOf(`"${anchorLower}"`);
      if (idx === -1) idx = htmlLower.indexOf(`>${anchorLower} `);
      if (idx === -1) idx = htmlLower.indexOf(anchorLower);
      if (idx === -1) continue;

      const chunkSize = rule.multiple ? 3000 : 400;
      const chunk = html.slice(idx, idx + chunkSize);

      if (rule.multiple) {
        const gRegex = getGlobalRegex(rule.extractRegex.source);
        const matches = [...chunk.matchAll(gRegex)];
        if (matches.length > 0) {
          results[rule.name] = matches
            .map(m => m[1]?.trim())
            .filter((val): val is string => !!val && !VALORES_INVALIDOS.has(val))
            .map(val => rule.formatter ? rule.formatter(val) : val);
          break;
        }
      } else {
        const match = chunk.match(rule.extractRegex);
        if (match?.[1]) {
          const raw = match[1].trim();
          if (!VALORES_INVALIDOS.has(raw)) {
            results[rule.name] = rule.formatter ? rule.formatter(raw) : raw;
            break;
          }
        }
      }
    }
  }

  return results as Partial<T>;
}

// ════════════════════════════════════════════════════════════════════════════
// 9. SCHEMAS ZOD
// ════════════════════════════════════════════════════════════════════════════

export const B3Schema = z.object({
  precoAtual:    z.union([z.number(), z.string()]).optional(),
  dividendYield: z.string().optional(),
  pl:            z.union([z.number(), z.string()]).optional(),
  pvp:           z.union([z.number(), z.string()]).optional(),
  vpa:           z.union([z.number(), z.string()]).optional(),
  lpa:           z.union([z.number(), z.string()]).optional(),
  roe:           z.string().optional(),
  roic:          z.string().optional(),
  margemLiquida: z.string().optional(),
  margemBruta:   z.string().optional(),
  evEbitda:      z.union([z.number(), z.string()]).optional(),
  pEbit:         z.union([z.number(), z.string()]).optional(),
  psr:           z.union([z.number(), z.string()]).optional(),
  pAtivo:        z.union([z.number(), z.string()]).optional(),
  pCapGiro:      z.union([z.number(), z.string()]).optional(),
  dividaLiquidaEbitda: z.union([z.number(), z.string()]).optional(),
  variacaoDay:   z.string().optional(),
  about:         z.string().optional(),
  sector:        z.string().optional(),
  subSector:     z.string().optional(),
});

export const FIISchema = z.object({
  precoAtual:        z.union([z.number(), z.string()]).optional(),
  dividendYield:     z.string().optional(),
  pvp:               z.union([z.number(), z.string()]).optional(),
  valorPatrimonial:  z.union([z.number(), z.string()]).optional(),
  liquidezDiaria:    z.union([z.number(), z.string()]).optional(),
  ultimoRendimento:  z.union([z.number(), z.string()]).optional(),
  vacanciaFisica:    z.string().optional(),
  patrimonioLiquido: z.union([z.number(), z.string()]).optional(),
  variacaoDay:       z.string().optional(),
  about:             z.string().optional(),
  sector:            z.string().optional(),
  subSector:         z.string().optional(),
});

export const ETFSchema = z.object({
  precoAtual:        z.union([z.number(), z.string()]).optional(),
  dividendYield:     z.string().optional(),
  pvp:               z.union([z.number(), z.string()]).optional(),
  patrimonioLiquido: z.union([z.number(), z.string()]).optional(),
  taxaAdmin:         z.string().optional(),
  variacaoDay:       z.string().optional(),
  about:             z.string().optional(),
  sector:            z.string().optional(),
  subSector:         z.string().optional(),
});

export type B3Data  = z.infer<typeof B3Schema>;
export type FIIData = z.infer<typeof FIISchema>;
export type ETFData = z.infer<typeof ETFSchema>;

// ════════════════════════════════════════════════════════════════════════════
// 10. TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

const COMMON_FORMATTERS = {
  num: (r: string) => normalizeBRNumber(r),
  pct: (r: string) => r.includes('%') ? r : r + '%',
};

export const acaoTemplate: ExtractorTemplate<B3Data> = {
  name: 'B3_ACAO',
  schema: B3Schema,
  rules: [
    { name: 'precoAtual',    anchors: ['Preço Atual', 'Cotação', 'cotacao'],            extractRegex: /_card-body[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,  formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield', anchors: ['Dividend Yield', 'DY', 'Yield'],               extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+\s*%?)\s*</,      formatter: COMMON_FORMATTERS.pct },
    { name: 'pl',            anchors: ['P/L', 'P/Lucro', 'Preço/Lucro'],               extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pvp',           anchors: ['P/VP', 'P/Valor Patrimonial'],                  extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'vpa',           anchors: ['VPA', 'Valor Patrimonial por Ação'],            extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'lpa',           anchors: ['LPA', 'Lucro por Ação'],                        extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'roe',           anchors: ['ROE', 'Retorno sobre Patrimônio'],              extractRegex: /_card-body[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'roic',          anchors: ['ROIC'],                                          extractRegex: /_card-body[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'margemLiquida', anchors: ['Margem Líquida', 'Margem Liquida'],             extractRegex: /_card-body[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'margemBruta',   anchors: ['Margem Bruta'],                                 extractRegex: /_card-body[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'evEbitda',      anchors: ['EV/EBITDA'],                                    extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pEbit',         anchors: ['P/EBIT'],                                       extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'psr',           anchors: ['PSR'],                                          extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pAtivo',        anchors: ['P/Ativo'],                                      extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pCapGiro',      anchors: ['P/Cap. Giro', 'P/Capital de Giro'],             extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'dividaLiquidaEbitda', anchors: ['Dív. Líq. / EBITDA', 'Divida Liquida / EBITDA'], extractRegex: /_card-body[\s\S]*?>\s*([\d,.-]+)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'variacaoDay',   anchors: ['Variação', 'variacao', 'Var. Dia', 'var-day'], extractRegex: /_card-body[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'sector',        anchors: ['Setor'],                                        extractRegex: /_card-body[\s\S]*?>\s*([\w\s&]+)\s*</ },
    { name: 'subSector',     anchors: ['Subsetor'],                                     extractRegex: /_card-body[\s\S]*?>\s*([\w\s&]+)\s*</ },
    { name: 'about',         anchors: ['Sobre a Empresa', 'Descrição'],                 extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
  ],
};

export const fiiTemplate: ExtractorTemplate<FIIData> = {
  name: 'B3_FII',
  schema: FIISchema,
  rules: [
    { name: 'precoAtual',        anchors: ['Preço Atual', 'Cotação'],              extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield',     anchors: ['Dividend Yield', 'DY', 'Yield'],       extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'pvp',               anchors: ['P/VP'],                                 extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'valorPatrimonial',  anchors: ['Valor Patrimonial', 'VP/Cota'],         extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'liquidezDiaria',    anchors: ['Liquidez', 'Liquidez Diária'],          extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+[KMB]?)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'ultimoRendimento',  anchors: ['Último Rendimento', 'Rendimento'],      extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'vacanciaFisica',    anchors: ['Vacância Física', 'Vacância'],          extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'patrimonioLiquido', anchors: ['Patrimônio Líquido', 'Patrimônio'],     extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+[KMB]?)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'variacaoDay',       anchors: ['Variação', 'variacao'],                 extractRegex: /_card-body[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'sector',            anchors: ['Segmento'],                             extractRegex: /_card-body[\s\S]*?>\s*([\w\s&]+)\s*</ },
    { name: 'about',             anchors: ['Sobre o Fundo', 'Descrição'],           extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
  ],
};

export const bdrTemplate  = acaoTemplate;
export const etfTemplate: ExtractorTemplate<ETFData> = {
  name: 'B3_ETF',
  schema: ETFSchema,
  rules: [
    { name: 'precoAtual',        anchors: ['Preço Atual', 'Cotação'],              extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield',     anchors: ['Dividend Yield', 'DY', 'Yield'],       extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'pvp',               anchors: ['P/VP'],                                 extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'patrimonioLiquido', anchors: ['Patrimônio Líquido', 'Patrimônio'],     extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+[KMB]?)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'taxaAdmin',         anchors: ['Taxa de Administração', 'Taxa Admin'],  extractRegex: /_card-body[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'variacaoDay',       anchors: ['Variação', 'variacao'],                 extractRegex: /_card-body[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'about',             anchors: ['Sobre o ETF', 'Descrição'],             extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
  ],
};

const ASSET_PRESETS: Record<string, {
  i10Base: string;
  siBase:  string;
  template: ExtractorTemplate<any>;
}> = {
  ACAO: { i10Base: 'https://investidor10.com.br/acoes',  siBase: 'https://statusinvest.com.br/acoes',              template: acaoTemplate },
  FII:  { i10Base: 'https://investidor10.com.br/fiis',   siBase: 'https://statusinvest.com.br/fundos-imobiliarios', template: fiiTemplate  },
  BDR:  { i10Base: 'https://investidor10.com.br/bdrs',   siBase: 'https://statusinvest.com.br/bdrs',               template: bdrTemplate  },
  ETF:  { i10Base: 'https://investidor10.com.br/etfs',   siBase: 'https://statusinvest.com.br/etfs',               template: etfTemplate  },
  STOCK: { i10Base: 'https://investidor10.com.br/stocks', siBase: 'https://statusinvest.com.br/stocks',            template: acaoTemplate },
  CRYPTO: { i10Base: 'https://investidor10.com.br/cripto', siBase: 'https://statusinvest.com.br/cripto',           template: acaoTemplate },
};

// ════════════════════════════════════════════════════════════════════════════
// 11. YAHOO FINANCE
// ════════════════════════════════════════════════════════════════════════════

interface YahooQuoteData {
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  trailingPE?: number;
  priceToBook?: number;
  bookValue?: number;
  epsTrailingTwelveMonths?: number;
  trailingAnnualDividendYield?: number;
  marketCap?: number;
  longName?: string;
  shortName?: string;
}

interface YahooFundamentalsData {
  profitMargins?: number;
  returnOnEquity?: number;
  revenuePerShare?: number;
  returnOnAssets?: number;
  grossMargins?: number;
  operatingMargins?: number;
  debtToEquity?: number;
  about?: string;
  sector?: string;
  subSector?: string;
  enterpriseValue?: number;
  forwardPE?: number;
  pegRatio?: number;
}

async function yahooQuote(ticker: string, _timeoutMs: number): Promise<YahooQuoteData | null> {
  const symbols = [`${ticker}.SA`, ticker.toUpperCase()];
  for (const symbol of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol);
      if (!quote || !quote.regularMarketPrice) continue;
      
      return {
        regularMarketPrice:          quote.regularMarketPrice,
        regularMarketChangePercent:  quote.regularMarketChangePercent,
        trailingPE:                  quote.trailingPE,
        priceToBook:                 quote.priceToBook,
        bookValue:                   quote.bookValue,
        epsTrailingTwelveMonths:     quote.epsTrailingTwelveMonths,
        trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
        marketCap:                   quote.marketCap,
        longName:                    quote.longName,
        shortName:                   quote.shortName,
      };
    } catch (e) { 
      console.warn(`[YAHOO] Erro ao buscar quote para ${symbol}:`, (e as Error).message);
      continue; 
    }
  }
  return null;
}

async function yahooFundamentals(ticker: string, _timeoutMs: number): Promise<YahooFundamentalsData> {
  const symbols  = [`${ticker}.SA`, ticker.toUpperCase()];
  for (const symbol of symbols) {
    try {
      const result = await (yahooFinance as any).quoteSummary(symbol, {
        modules: ['financialData', 'defaultKeyStatistics', 'assetProfile']
      });
      
      const fd = result?.financialData;
      const ks = result?.defaultKeyStatistics;
      const ap = result?.assetProfile;
      
      if (!fd && !ks && !ap) continue;
      
      return {
        profitMargins:    fd?.profitMargins,
        returnOnEquity:   fd?.returnOnEquity,
        revenuePerShare:  fd?.revenuePerShare,
        returnOnAssets:   fd?.returnOnAssets,
        grossMargins:     fd?.grossMargins,
        operatingMargins: fd?.operatingMargins,
        debtToEquity:     fd?.debtToEquity,
        // Novos campos
        about:            ap?.longBusinessSummary,
        sector:           ap?.sector,
        subSector:        ap?.industry,
        enterpriseValue:  ks?.enterpriseValue,
        forwardPE:        ks?.forwardPE,
        pegRatio:         ks?.pegRatio,
      };
    } catch (e) { 
      console.warn(`[YAHOO] Erro ao buscar fundamentos para ${symbol}:`, (e as Error).message);
      continue; 
    }
  }
  return {};
}

// ════════════════════════════════════════════════════════════════════════════
// 12. MOTOR PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class NexusEngine {
  private static _urlInFlight     = new Map<string, Promise<any>>();
  private static _tickerInFlight  = new Map<string, Promise<any>>();
  private static _cache           = new LRUCache<any>(300);
  private static _circuitBreakers = new Map<string, CircuitBreaker>();
  private static _startTime       = Date.now();
  private static _totalRequests   = 0;
  private static _totalSuccess    = 0;
  private static _totalFailures   = 0;
  private static _sessionMetrics  = { cacheHits: 0, cacheStale: 0, cacheMisses: 0 };

  private static _options: Required<NexusEngineOptions> = {
    cacheTtlMs:       24 * 60 * 60 * 1_000,
    cacheStaleMs:     5  * 60 * 1_000,
    maxRetries:       3,
    retryBaseDelay:   500,
    fetchTimeoutMs:   10_000,
    concurrencyLimit: 5,
    domainRps:        2,
    domainBurst:      5,
  };

  private static _rateLimiters = new Map<string, DomainRateLimiter>();

  static configure(opts: NexusEngineOptions): void {
    this._options = { ...this._options, ...opts };
    this._rateLimiters.clear();
  }

  private static getRateLimiter(domain: string): DomainRateLimiter {
    let limiter = this._rateLimiters.get(domain);
    if (!limiter) {
      limiter = new DomainRateLimiter(this._options.domainRps, this._options.domainBurst);
      this._rateLimiters.set(domain, limiter);
    }
    return limiter;
  }

  private static getCB(domain: string): CircuitBreaker {
    if (!this._circuitBreakers.has(domain)) {
      this._circuitBreakers.set(domain, new CircuitBreaker());
    }
    return this._circuitBreakers.get(domain)!;
  }

  static resetCircuitBreaker(domain: string): void {
    this._circuitBreakers.get(domain)?.reset();
  }

  private static async fetchWithJitter(
    url: string,
    requireStealth: boolean,
  ): Promise<Response> {
    let lastErr: Error = new Error('fetch falhou');
    const hostname = extractHostname(url);
    const domain   = hostname.replace('www.', '').split('.')[0];
    const limiter  = this.getRateLimiter(domain);

    for (let attempt = 0; attempt < this._options.maxRetries; attempt++) {
      await limiter.acquire();
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this._options.fetchTimeoutMs);

      try {
        const res = await fetch(url, {
          signal:  ctrl.signal,
          headers: requireStealth ? getStealthHeaders(url) : { 'User-Agent': getRandomAgent() },
        });
        clearTimeout(timer);

        if (res.status === 404 || res.status === 451) {
          throw new Error(`Critical HTTP ${res.status}`);
        }
        if (res.status === 410) {
          console.warn(`Resource gone (410): ${url}`);
          return res; // Or handle as needed, e.g., return null or empty response
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;

      } catch (err) {
        clearTimeout(timer);
        lastErr = err as Error;
        if (lastErr.message.includes('Critical')) throw lastErr;
        if (attempt < this._options.maxRetries - 1) {
          await new Promise(r => setTimeout(r, backoffMs(attempt, this._options.retryBaseDelay)));
        }
      }
    }
    throw lastErr;
  }

  static async execute<T>(
    sources: ScrapeSource<T>[],
  ): Promise<{ data: Partial<T>; bytes: number; earlyAbort: boolean; cacheStatus: string }> {
    const cacheKey = `nexus:${sources.map(s => s.url).join('|')}`;
    const cached   = this._cache.get(cacheKey);

    if (cached) {
      if (cached.isStale) {
        this._sessionMetrics.cacheStale++;
        if (!this._tickerInFlight.has(cacheKey)) {
          const bg = this._executeNetwork(sources)
            .then(fresh => this._cache.set(cacheKey, fresh, this._options.cacheStaleMs, this._options.cacheTtlMs))
            .catch(() => {});
          this._tickerInFlight.set(cacheKey, bg);
          bg.finally(() => this._tickerInFlight.delete(cacheKey));
        }
        return { ...cached.data, cacheStatus: 'STALE' };
      }
      this._sessionMetrics.cacheHits++;
      return { ...cached.data, cacheStatus: 'HIT' };
    }

    const inflight = this._tickerInFlight.get(cacheKey);
    if (inflight) return inflight;

    this._sessionMetrics.cacheMisses++;
    const p = this._executeNetwork(sources).then(fresh => {
      this._cache.set(cacheKey, fresh, this._options.cacheStaleMs, this._options.cacheTtlMs);
      return { ...fresh, cacheStatus: 'MISS' };
    });
    this._tickerInFlight.set(cacheKey, p);
    p.finally(() => this._tickerInFlight.delete(cacheKey));
    return p;
  }

  private static async _executeNetwork<T>(
    sources: ScrapeSource<T>[],
  ): Promise<{ data: Partial<T>; bytes: number; earlyAbort: boolean }> {
    let lastErr: Error = new Error('Nenhuma fonte disponível');
    let openCBs = 0;

    for (const source of sources) {
      const hostname = extractHostname(source.url);
      const domain   = hostname.replace('www.', '').split('.')[0];
      const cb       = this.getCB(domain);

      if (cb.isOpen()) {
        openCBs++;
        continue;
      }

      try {
        let fetchPromise = this._urlInFlight.get(source.url);
        if (!fetchPromise) {
          this._totalRequests++;
          fetchPromise = this._streamAndParse<T>(source, cb);
          this._urlInFlight.set(source.url, fetchPromise);
          fetchPromise.finally(() => this._urlInFlight.delete(source.url));
        }

        return await fetchPromise;
      } catch (err) {
        lastErr = err as Error;
        if (lastErr.message.includes('Critical')) break;
        continue;
      }
    }
    
    if (openCBs === sources.length && sources.length > 0) {
      throw new Error(`Todos os Circuit Breakers abertos (${openCBs}/${sources.length} fontes)`);
    }
    throw new Error(`Falha total: ${lastErr.message}`);
  }

  private static async _streamAndParse<T>(
    source: ScrapeSource<T>,
    cb: CircuitBreaker,
  ): Promise<{ data: Partial<T>; bytes: number; earlyAbort: boolean }> {
    try {
      const res = await this.fetchWithJitter(source.url, !!source.requireStealth);
      if (res.status === 410) return { data: {}, bytes: 0, earlyAbort: true };
      if (!res.body) throw new Error('No response body');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let htmlBuffer = '';
      let rawData: Partial<T> = {};
      let bytesRead  = 0;
      let earlyAbort = false;

      const MAX_WINDOW   = 20_000;
      const MAX_ANCHOR   = source.template.rules.reduce((max, r) => r.anchors.reduce((m, a) => Math.max(m, a.length), max), 0);
      const OVERLAP_SIZE = Math.max(MAX_ANCHOR + 256, 512);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          bytesRead  += value.length;
          htmlBuffer += decoder.decode(value, { stream: true });

          if (htmlBuffer.length > MAX_WINDOW) {
            htmlBuffer = htmlBuffer.slice(-(MAX_WINDOW - OVERLAP_SIZE));
          }

          rawData = universalLexer<T>(htmlBuffer, source.template, rawData);

          const hasAll = source.template.rules.every(r => rawData[r.name as keyof T] !== undefined);
          if (hasAll) {
            reader.cancel().catch(() => {});
            earlyAbort = true;
            break;
          }
        }

        if (!earlyAbort) {
          const tail = decoder.decode();
          if (tail) {
            htmlBuffer += tail;
            rawData = universalLexer<T>(htmlBuffer, source.template, rawData);
          }
        }
      } finally {
        try { reader.releaseLock(); } catch { /* ignore */ }
      }

      cb.recordSuccess();
      this._totalSuccess++;
      return { data: rawData, bytes: bytesRead, earlyAbort };

    } catch (err) {
      cb.recordFailure();
      this._totalFailures++;
      throw err;
    }
  }

  static async fetchNews(ticker: string): Promise<NewsItem[]> {
    const clean = canonicalizeTicker(ticker);
    try {
      // Usando um timeout menor e headers mais realistas
      const res = await fetch(`https://news.google.com/rss/search?q=${clean}+acao+OR+fii+OR+b3&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
        headers: { 'User-Agent': getRandomAgent() }
      });
      if (!res.ok) return [];
      const xml = await res.text();
      
      const items: NewsItem[] = [];
      // Regex mais robusto para capturar itens
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
        const itemXml = match[1];
        const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(itemXml);
        const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/.exec(itemXml);
        const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/.exec(itemXml);
        const sourceMatch = /<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/.exec(itemXml);
        
        if (titleMatch && linkMatch) {
          // Limpeza básica de HTML entities
          const cleanTitle = titleMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/ - [^-]+$/, ''); // Remove o nome da fonte do título se estiver no final (padrão Google News)

          items.push({
            title: cleanTitle,
            link: linkMatch[1],
            pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : undefined,
            source: sourceMatch ? sourceMatch[1] : undefined,
          });
        }
      }
      return items;
    } catch (e) {
      console.error(`[Nexus] Error fetching news for ${ticker}:`, e);
      return [];
    }
  }

  /**
   * Busca rankings de ativos baseados em critérios específicos.
   * Simula a extração de dados de rankings do Investidor10/StatusInvest.
   */
  static async fetchRanking(category: string, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const cacheKey = `ranking:${category}:${type}`;
    const cached = this._cache.get(cacheKey);
    if (cached && !this.isStale(cached)) return cached.data;

    try {
      // Como não temos uma API direta de ranking, vamos buscar os top ativos do Yahoo Finance
      // ou simular baseado em uma lista pré-definida de ativos populares se a busca falhar.
      const popularTickers: any = {
        ACAO: ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4', 'ABEV3', 'WEGE3', 'RENT3', 'ELET3', 'MGLU3'],
        FII: ['HGLG11', 'KNRI11', 'XPLG11', 'MXRF11', 'VISC11', 'BTLG11', 'XPML11', 'IRDM11'],
        BDR: ['AAPL34', 'GOGL34', 'AMZO34', 'MSFT34', 'TSLA34', 'NVDC34', 'META34'],
        ETF: ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11'],
        STOCK: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NVDA', 'BRK-B'],
        CRYPTO: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD']
      };

      const tickers = popularTickers[type] || popularTickers.ACAO;
      
      // Buscamos dados básicos para esses ativos
      const results = await this.executeBatch(
        tickers.map(ticker => async () => {
          try {
            const data = await this.fetchAtivo(ticker, type);
            return {
              ticker: ticker,
              name: data.results.name || ticker,
              value: data.results.dividendYield || data.results.pl || 'N/A',
              subValue: `R$ ${data.results.precoAtual || '0,00'}`,
              raw: data.results
            };
          } catch {
            return null;
          }
        })
      );

      const filteredResults = results.filter(r => r !== null) as any[];

      // Ordenação baseada na categoria
      let sorted = [...filteredResults];
      if (category.toLowerCase().includes('dividend') || category.toLowerCase().includes('yield')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.dividendYield);
          const v2 = safeParse(b.raw?.dividendYield);
          return v2 - v1;
        });
      } else if (category.toLowerCase().includes('pl') || category.toLowerCase().includes('baratas')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.pl) || 999;
          const v2 = safeParse(b.raw?.pl) || 999;
          return v1 - v2;
        });
      } else if (category.toLowerCase().includes('altas') || category.toLowerCase().includes('gainers')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.variacaoDay);
          const v2 = safeParse(b.raw?.variacaoDay);
          return v2 - v1;
        });
      } else if (category.toLowerCase().includes('roe')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.roe);
          const v2 = safeParse(b.raw?.roe);
          return v2 - v1;
        });
      } else if (category.toLowerCase().includes('margem')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.margemLiquida);
          const v2 = safeParse(b.raw?.margemLiquida);
          return v2 - v1;
        });
      } else if (category.toLowerCase().includes('pvp')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.pvp) || 999;
          const v2 = safeParse(b.raw?.pvp) || 999;
          return v1 - v2;
        });
      }

      const finalData = sorted.slice(0, 10);
      this._cache.set(cacheKey, { data: finalData, timestamp: Date.now() }, this._options.cacheStaleMs, this._options.cacheTtlMs);
      return finalData;
    } catch (e) {
      console.error(`[Nexus] Error fetching ranking ${category}:`, e);
      return [];
    }
  }

  /**
   * Busca ativos similares (peers) para comparação.
   */
  static async fetchPeers(ticker: string, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const clean = canonicalizeTicker(ticker);
    const cacheKey = `peers:${clean}:${type}`;
    const cached = this._cache.get(cacheKey);
    if (cached && !this.isStale(cached)) return cached.data;

    try {
      const sectorPeers: Record<string, string[]> = {
        'PETR4': ['PETR3', 'PRIO3', 'RECV3', 'RRRP3', 'UGPA3'],
        'VALE3': ['CSNA3', 'GGBR4', 'GOAU4', 'USIM5'],
        'ITUB4': ['BBDC4', 'BBAS3', 'SANB11', 'BPAC11'],
        'BBDC4': ['ITUB4', 'BBAS3', 'SANB11', 'BPAC11'],
        'BBAS3': ['ITUB4', 'BBDC4', 'SANB11', 'BPAC11'],
        'ABEV3': ['MDIA3', 'SMTO3', 'BEEF3', 'MRFG3'],
        'WEGE3': ['TUPY3', 'ROMI3', 'KEPL3'],
        'MGLU3': ['VIIA3', 'AMER3', 'LREN3', 'CEAB3'],
        'HGLG11': ['XPLG11', 'BTLG11', 'VILG11', 'KNRI11'],
        'MXRF11': ['CPTS11', 'IRDM11', 'KNIP11', 'DEVA11'],
      };

      let peers = sectorPeers[clean] || [];
      
      if (peers.length === 0) {
        const popular: any = {
          ACAO: ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4'],
          FII: ['HGLG11', 'MXRF11', 'KNRI11', 'XPLG11', 'VISC11'],
          BDR: ['AAPL34', 'GOGL34', 'AMZO34', 'MSFT34', 'TSLA34'],
          ETF: ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11'],
          STOCK: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'],
          CRYPTO: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD']
        };
        peers = popular[type] || popular.ACAO;
      }

      peers = peers.filter(p => p !== clean).slice(0, 5);

      const results = await this.executeBatch(
        peers.map(p => async () => {
          try {
            const data = await this.fetchAtivo(p, type);
            return {
              ticker: p,
              name: data.results.name || p,
              pl: data.results.pl || 'N/A',
              pvp: data.results.pvp || 'N/A',
              dy: data.results.dividendYield?.replace('%', '') || '0',
              roe: data.results.roe?.replace('%', '') || '0',
              precoAtual: data.results.precoAtual || 0
            };
          } catch {
            return null;
          }
        })
      );

      const finalData = results.filter(r => r !== null) as any[];
      this._cache.set(cacheKey, { data: finalData, timestamp: Date.now() }, this._options.cacheStaleMs, this._options.cacheTtlMs);
      return finalData;
    } catch (e) {
      console.error(`[Nexus] Error fetching peers for ${ticker}:`, e);
      return [];
    }
  }

  private static isStale(cached: any): boolean {
    if (!cached || !cached.timestamp) return true;
    return Date.now() - cached.timestamp > this._options.cacheStaleMs;
  }

  /**
   * Executa um filtro (screener) em uma lista de ativos.
   */
  static async screener(filters: any, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const popularTickers: any = {
      ACAO: ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4', 'ABEV3', 'WEGE3', 'RENT3', 'ELET3', 'MGLU3', 'B3SA3', 'HAPV3', 'GGBR4', 'ITSA4', 'SUZB3', 'JBSS3', 'RAIL3', 'CSAN3', 'VIBRA3', 'EQTL3', 'LREN3', 'PRIO3', 'GOAU4', 'CPLE6', 'CMIG4', 'SANB11', 'BPAC11', 'KLBN11', 'TAEE11', 'TRPL4'],
      FII: ['HGLG11', 'KNRI11', 'XPLG11', 'MXRF11', 'VISC11', 'BTLG11', 'XPML11', 'IRDM11', 'CPTS11', 'BCFF11', 'BRCR11', 'HGBS11', 'JSRE11', 'VILG11', 'RBRP11', 'KNIP11', 'KNCR11', 'HGRU11', 'PVBI11', 'LVBI11'],
      BDR: ['AAPL34', 'GOGL34', 'AMZO34', 'MSFT34', 'TSLA34', 'NVDC34', 'META34', 'NFLX34', 'DISB34', 'PYPL34', 'BABA34', 'NIKE34', 'JNJB34', 'PGCO34', 'VIVT34'],
      ETF: ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11', 'DIVO11', 'FIND11', 'MATB11', 'GOVE11', 'XFIX11', 'GOLD11', 'SPXI11'],
      STOCK: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS'],
      CRYPTO: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'DOT-USD', 'DOGE-USD', 'LINK-USD']
    };

    const tickers = popularTickers[type] || popularTickers.ACAO;
    
    const results = await this.executeBatch(
      tickers.map(ticker => async () => {
        try {
          const data = await this.fetchAtivo(ticker, type);
          return {
            ticker: ticker,
            name: data.results.name || ticker,
            results: data.results
          };
        } catch {
          return null;
        }
      })
    );

    let filtered = results.filter(r => r !== null) as any[];

    // Aplicar filtros
    if (filters.minDY) {
      filtered = filtered.filter(r => {
        const dy = parseFloat(r.results.dividendYield?.replace('%', '').replace(',', '.') || '0');
        return dy >= parseFloat(filters.minDY);
      });
    }
    if (filters.maxPL) {
      filtered = filtered.filter(r => {
        const pl = parseFloat(r.results.pl?.replace(',', '.') || '999');
        return pl > 0 && pl <= parseFloat(filters.maxPL);
      });
    }
    if (filters.maxPVP) {
      filtered = filtered.filter(r => {
        const pvp = parseFloat(r.results.pvp?.replace(',', '.') || '999');
        return pvp > 0 && pvp <= parseFloat(filters.maxPVP);
      });
    }
    if (filters.minROE) {
      filtered = filtered.filter(r => {
        const roe = parseFloat(r.results.roe?.replace('%', '').replace(',', '.') || '0');
        return roe >= parseFloat(filters.minROE);
      });
    }
    if (filters.minMargemLiquida) {
      filtered = filtered.filter(r => {
        const margem = parseFloat(r.results.margemLiquida?.replace('%', '').replace(',', '.') || '0');
        return margem >= parseFloat(filters.minMargemLiquida);
      });
    }
    if (filters.minVPA) {
      filtered = filtered.filter(r => {
        const vpa = parseFloat(r.results.vpa?.replace(',', '.') || '0');
        return vpa >= parseFloat(filters.minVPA);
      });
    }

    return filtered;
  }

  static async fetchAtivo(
    ticker: string,
    type: ExtendedAssetType = 'ACAO',
    includeNews = false,
  ): Promise<{
    ticker: string;
    results: any;
    cacheStatus: string;
    news?: NewsItem[];
    metrics: any;
  }> {
    const cleanTicker = canonicalizeTicker(ticker);
    const erroVal     = validarTicker(cleanTicker);
    if (erroVal) {
      return { ticker: cleanTicker, results: {}, cacheStatus: 'ERROR', metrics: { error: erroVal } };
    }
    const preset  = ASSET_PRESETS[type] || ASSET_PRESETS.ACAO;
    const t       = cleanTicker.toLowerCase();
    const sources: ScrapeSource<any>[] = preset ? [
      { url: `${preset.i10Base}/${t}/`, template: preset.template, requireStealth: true },
      { url: `${preset.siBase}/${t}/`,  template: preset.template, requireStealth: true },
    ] : [];

    const startTime = performance.now();
    const startCpu  = safeCpuStart();

    const [scrapeResult, yahooResult, yahooFund, newsResult] = await Promise.allSettled([
      this.execute(sources),
      yahooQuote(cleanTicker, this._options.fetchTimeoutMs),
      yahooFundamentals(cleanTicker, this._options.fetchTimeoutMs),
      includeNews ? this.fetchNews(cleanTicker) : Promise.resolve(undefined),
    ]);

    const scrape   = scrapeResult.status === 'fulfilled' ? scrapeResult.value : { data: {}, bytes: 0, earlyAbort: false, cacheStatus: 'ERROR' };
    const quote    = yahooResult.status  === 'fulfilled' ? yahooResult.value  : null;
    const fund     = yahooFund.status    === 'fulfilled' ? yahooFund.value    : {};
    const newsData = newsResult.status   === 'fulfilled' ? newsResult.value   : undefined;
    const combined = { ...scrape.data } as Record<string, any>;

    const fill = (k: string, v: unknown) => {
      if (combined[k] !== undefined || v == null) return;
      const s = typeof v === 'number' ? v.toFixed(2) : String(v).trim();
      if (!VALORES_INVALIDOS.has(s)) combined[k] = s;
    };

    if (quote) {
      const q = quote as any;
      fill('precoAtual',    q.regularMarketPrice);
      fill('variacaoDay',   q.regularMarketChangePercent != null
        ? q.regularMarketChangePercent.toFixed(2) + '%' : undefined);
      fill('pl',            q.trailingPE);
      fill('pvp',           q.priceToBook);
      fill('vpa',           q.bookValue);
      fill('lpa',           q.epsTrailingTwelveMonths);
      fill('dividendYield', q.trailingAnnualDividendYield != null
        ? (q.trailingAnnualDividendYield * 100).toFixed(2) + '%' : undefined);
      fill('marketCap',     q.marketCap);
      fill('name',          q.longName || q.shortName);
    }
    if (fund) {
      fill('margemLiquida',  fund.profitMargins    != null ? (fund.profitMargins    * 100).toFixed(2) + '%' : undefined);
      fill('margemBruta',    fund.grossMargins     != null ? (fund.grossMargins     * 100).toFixed(2) + '%' : undefined);
      fill('roe',            fund.returnOnEquity   != null ? (fund.returnOnEquity   * 100).toFixed(2) + '%' : undefined);
      fill('roa',            fund.returnOnAssets   != null ? (fund.returnOnAssets   * 100).toFixed(2) + '%' : undefined);
      fill('dividaLiquidaEbitda', fund.debtToEquity != null ? fund.debtToEquity.toFixed(2) : undefined);
      fill('about',          fund.about);
      fill('sector',         fund.sector);
      fill('subSector',      fund.subSector);
      fill('enterpriseValue', fund.enterpriseValue);
      fill('forwardPE',      fund.forwardPE);
      fill('pegRatio',       fund.pegRatio);
    }

    const totalTimeMs = performance.now() - startTime;
    const sources_used: string[] = [];
    if (scrapeResult.status === 'fulfilled' && Object.keys(scrape.data).length > 0) sources_used.push('Scraper');
    if (quote) sources_used.push('YahooFinance');
    if (Object.keys(fund).length) sources_used.push('YahooFundamentals');

    return {
      ticker:      cleanTicker,
      results:     combined,
      cacheStatus: scrape.cacheStatus || 'MISS',
      ...(newsData ? { news: newsData } : {}),
      metrics: {
        totalTimeMs,
        bytesProcessed:    scrape.bytes,
        foundKeys:         Object.keys(combined),
        successRate:       Object.keys(combined).length / preset.template.rules.length,
        earlyAbort:        scrape.earlyAbort,
        source:            sources_used.join(' + ') || 'None',
        cpuUsageMs:        safeCpuDeltaMs(startCpu),
        estimatedMemoryMb: Number((scrape.bytes / 1024 / 1024).toFixed(2)),
      },
    };
  }

  static async fetchB3(ticker: string): Promise<{ data: Partial<B3Data>; bytes: number; earlyAbort: boolean; cacheStatus: string }> {
    const r = await this.fetchAtivo(ticker, 'ACAO');
    return { data: r.results, bytes: r.metrics.bytesProcessed, earlyAbort: r.metrics.earlyAbort, cacheStatus: r.cacheStatus };
  }

  static async fetchHistoricoGrafico(ticker: string, range: string = '1y', interval: string = '1d'): Promise<any[]> {
    const cleanTicker = canonicalizeTicker(ticker);
    const symbols = [`${cleanTicker}.SA`, cleanTicker];
      
    for (const symbol of symbols) {
      try {
        const result = await (yahooFinance as any).chart(symbol, {
          period1: range, // yahoo-finance2 handles '1y', '1mo', etc.
          interval: interval as any,
        });
        
        if (!result || !result.quotes || result.quotes.length === 0) continue;
        
        return result.quotes.map((q: any) => ({
          date: q.date.toISOString(),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume,
        })).filter((d: any) => d.close !== null && d.close !== undefined);
      } catch (e) {
        console.warn(`[YAHOO] Erro ao buscar histórico para ${symbol}:`, (e as Error).message);
        continue;
      }
    }
    return [];
  }

  static async fetchDividends(ticker: string): Promise<any[]> {
    const cleanTicker = canonicalizeTicker(ticker);
    const symbols = [`${cleanTicker}.SA`, cleanTicker];
      
    for (const symbol of symbols) {
      try {
        const result = await (yahooFinance as any).chart(symbol, {
          period1: '5y',
          interval: '1mo',
          events: 'div',
        });
        
        const events = result?.events?.dividends;
        if (!events || events.length === 0) continue;
        
        return events.map((d: any) => ({
          date: d.date.toISOString(),
          amount: d.amount,
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        console.warn(`[YAHOO] Erro ao buscar dividendos para ${symbol}:`, (e as Error).message);
        continue;
      }
    }
    return [];
  }

  static async searchTicker(query: string): Promise<any[]> {
    try {
      const result = await (yahooFinance as any).search(query, {
        quotesCount: 10,
        newsCount: 0
      });
      
      return (result?.quotes ?? []).map((q: any) => ({
        ...q,
        ticker: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType
      }));
    } catch (e) {
      console.warn(`[YAHOO] Erro ao buscar ticker para ${query}:`, (e as Error).message);
      return [];
    }
  }

  static async executeBatch<T>(
    tasks: (() => Promise<T>)[],
    concurrency = this._options.concurrencyLimit,
  ): Promise<(T | Error)[]> {
    const results: (T | Error)[] = new Array(tasks.length);
    const executing = new Set<Promise<void>>();

    for (let i = 0; i < tasks.length; i++) {
      const idx = i;
      const p   = tasks[idx]()
        .then(res  => { results[idx] = res; })
        .catch(err => { results[idx] = err instanceof Error ? err : new Error(String(err)); })
        .finally(() => { executing.delete(p); });

      executing.add(p);
      if (executing.size >= concurrency) await Promise.race(executing);
    }
    await Promise.all(executing);
    return results;
  }

  static clearCache(): void {
    this._cache           = new LRUCache<any>(300);
    _hostnameCache.clear();
    _regexCache.clear();
  }

  static invalidateCache(ticker: string, type?: ExtendedAssetType): void {
    const clean = canonicalizeTicker(ticker);
    for (const t of (type ? [type] : ['ACAO', 'FII', 'BDR', 'ETF'] as ExtendedAssetType[])) {
      const preset = ASSET_PRESETS[t];
      const key    = `nexus:${preset.i10Base}/${clean}/|${preset.siBase}/${clean}/`;
      this._cache.delete(key);
    }
  }

  static getCacheStats() {
    const cbMetrics: Record<string, { estado: CBState; falhas: number }> = {};
    this._circuitBreakers.forEach((cb, domain) => {
      cbMetrics[domain] = { estado: cb.getState(), falhas: cb.getFalhas() };
    });

    const uptime = Date.now() - this._startTime;
    return {
      cache:             { tamanho: this._cache.tamanho, tamanhoMax: this._cache.tamanhoMax },
      session:           this._sessionMetrics,
      uptime,
      totalRequests:     this._totalRequests,
      totalSuccess:      this._totalSuccess,
      totalFailures:     this._totalFailures,
      successRate:       this._totalRequests > 0
        ? ((this._totalSuccess / this._totalRequests) * 100).toFixed(1) + '%' : 'N/A',
      inFlightRequests:  this._urlInFlight.size + this._tickerInFlight.size,
      rateLimiters:      Array.from(this._rateLimiters.keys()),
      circuitBreakers:   Object.keys(cbMetrics).length > 0 ? cbMetrics : {
        investidor10: { estado: 'FECHADO' as CBState, falhas: 0 },
        statusinvest: { estado: 'FECHADO' as CBState, falhas: 0 },
      },
    };
  }
}

export async function runNexusBatch(
  tickers:     string[],
  type:        ExtendedAssetType = 'ACAO',
  _opts?:      any,
  includeNews? : boolean,
): Promise<any[]> {
  return NexusEngine.executeBatch(
    tickers.map(ticker => async () => {
      const t0 = performance.now();
      try {
        const result = await NexusEngine.fetchAtivo(ticker, type, includeNews);
        return {
          ...result,
          metrics: {
            ...result.metrics,
            totalTimeMs: performance.now() - t0,
          },
        };
      } catch (e: any) {
        return {
          ticker:      canonicalizeTicker(ticker),
          results:     {},
          error:       e.message,
          cacheStatus: 'ERROR',
          metrics: {
            totalTimeMs:       performance.now() - t0,
            bytesProcessed:    0,
            foundKeys:         [],
            successRate:       0,
            earlyAbort:        false,
            source:            'Nexus Engine (Failed)',
            estimatedMemoryMb: 0,
            cpuUsageMs:        0,
          },
        };
      }
    }),
  );
}

export async function runNexusBatchAuto(
  tickers:     string[],
  _opts?:      any,
  includeNews?: boolean,
): Promise<any[]> {
  return NexusEngine.executeBatch(
    tickers.map(ticker => async () => {
      const type = inferAssetType(ticker);
      const t0   = performance.now();
      try {
        const result = await NexusEngine.fetchAtivo(ticker, type, includeNews);
        return { ...result, metrics: { ...result.metrics, totalTimeMs: performance.now() - t0 } };
      } catch (e: any) {
        return {
          ticker:      canonicalizeTicker(ticker),
          results:     {},
          error:       e.message,
          cacheStatus: 'ERROR',
          metrics: { totalTimeMs: performance.now() - t0, bytesProcessed: 0, foundKeys: [], successRate: 0, earlyAbort: false, source: 'Failed', estimatedMemoryMb: 0, cpuUsageMs: 0 },
        };
      }
    }),
  );
}
