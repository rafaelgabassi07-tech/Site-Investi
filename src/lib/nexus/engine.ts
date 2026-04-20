import { z } from 'zod';
import YahooFinance from 'yahoo-finance2';

export const yahooFinance = new YahooFinance();

// Set global config to quiet logs avoiding InvalidOptionsError
let yahooConfigured = false;
export function ensureYahooConfig() {
  if (yahooConfigured) return;
  try {
    // In some versions of yahoo-finance2, setGlobalConfig is on the instance
    if (typeof (yahooFinance as any).setGlobalConfig === 'function') {
      (yahooFinance as any).setGlobalConfig({
        validation: { logErrors: false, logOptionsErrors: false }
      });
    }
  } catch (e) {
    console.warn('[Nexus] Could not set yahoo-finance global config', e);
  }
  yahooConfigured = true;
}

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
  /**
   * Tamanho máximo do bloco de HTML a ser analisado após a âncora (default: multiple ? 3000 : 400)
   */
  chunkSize?: number;
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

export type ExtendedAssetType = 'ACAO' | 'FII' | 'BDR' | 'ETF' | 'STOCK';

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
const RE_HTML    = /<[^>]*>/g;
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

export function formatYahooError(error: any): string {
  if (!error) return 'Erro desconhecido';
  
  if (error.name === 'Failed validation' || (typeof error.message === 'string' && error.message.includes('validation'))) {
    return 'Divergência técnica nos dados (Validação de Schema)';
  }

  const extractMessages = (obj: any): string[] => {
    let messages: string[] = [];
    if (!obj || typeof obj !== 'object') return messages;

    const list = obj.errors || obj.subErrors;
    if (Array.isArray(list)) {
      list.forEach((e: any) => {
        if (e && typeof e === 'object') {
          if (e.message || e.description || e.title) {
            messages.push(e.message || e.description || e.title);
          }
          if (e.subErrors && Array.isArray(e.subErrors)) {
            messages.push(...extractMessages(e));
          }
        } else if (typeof e === 'string') {
          messages.push(e);
        }
      });
    } else if (obj.message) {
      messages.push(obj.message);
    }
    
    return messages;
  };

  try {
    let errorObj = error;
    if (typeof error === 'string') {
      const jsonMatch = error.match(/\{.*\}/s) || error.match(/\[.*\]/s);
      if (jsonMatch) {
         try {
           errorObj = JSON.parse(jsonMatch[0]);
         } catch { /* ignore */ }
      }
    }

    const messages = extractMessages(errorObj);
    if (messages.length > 0) {
      return Array.from(new Set(messages)).join('; ');
    }
  } catch (e) { /* ignore */ }

  const fallback = error.message || (typeof error === 'string' ? error : '');
  if (fallback && !fallback.includes('"errors":') && !fallback.includes('"subErrors":')) {
    return fallback.slice(0, 500);
  }

  return 'Erro na consulta de dados (Yahoo Finance). Verifique o ticker ou tente mais tarde.';
}

// ════════════════════════════════════════════════════════════════════════════
// 4. UTILITÁRIOS
// ════════════════════════════════════════════════════════════════════════════

export function normalizeBRNumber(raw: string): number | string {
  if (!raw) return '';
  
  // Limpeza inicial: remove HTML tags, R$, espaços e converte para maiúsculo
  let limpo = raw.replace(RE_HTML, '').replace(RE_MOEDA, '').toUpperCase().trim();
  
  if (limpo.includes('%')) return limpo;

  let mult = 1;
  // Detecção de sufixos de magnitude mais flexível (não precisa estar no final exato se houver sujeira)
  if (limpo.includes('TRILHÃO') || limpo.includes('TRILHÕES') || limpo.includes('TRILHAO') || limpo.includes('TRILHOES')) {
    mult = 1_000_000_000_000;
    limpo = limpo.replace(/TRILH(Ã|A)O|TRILH(Õ|O)ES/g, '');
  } else if (limpo.includes('BILHÃO') || limpo.includes('BILHÕES') || limpo.includes('BILHAO') || limpo.includes('BILHOES') || limpo.includes('BI') || (limpo.endsWith('B') && !limpo.endsWith('EB'))) {
    mult = 1_000_000_000;
    limpo = limpo.replace(/BILH(Ã|A)O|BILH(Õ|O)ES|BI|B/g, '');
  } else if (limpo.includes('MILHÃO') || limpo.includes('MILHÕES') || limpo.includes('MILHAO') || limpo.includes('MILHOES') || limpo.includes('MI') || (limpo.endsWith('M') && !limpo.match(/[A-Z]M$/))) {
    mult = 1_000_000;
    limpo = limpo.replace(/MILH(Ã|A)O|MILH(Õ|O)ES|MI|M/g, '');
  } else if (limpo.endsWith('K')) {
    mult = 1_000;
    limpo = limpo.slice(0, -1);
  }

  // Se houver múltiplos pontos e uma vírgula, o ponto é milhar e vírgula é decimal (Padrão BR)
  // Se houver apenas um separador e ele for ponto, pode ser decimal (Padrão US/Global)
  const dots = (limpo.match(/\./g) || []).length;
  const commas = (limpo.match(/,/g) || []).length;

  if (commas === 1) {
    // Padrão Brasileiro: 1.234,56
    limpo = limpo.replace(RE_MILHAR, '').replace(RE_DECIMAL, '.');
  } else if (commas === 0 && dots === 1) {
    // Padrão Americano ou Simples: 1234.56
    // Não mexer, parseFloat resolve
  } else if (commas === 0 && dots > 1) {
    // Padrão Brasileiro sem centavos: 1.234.567
    limpo = limpo.replace(RE_MILHAR, '');
  }

  const num = parseFloat(limpo);
  return isNaN(num) ? raw.trim() : num * mult;
}

export function inferAssetType(ticker: string): ExtendedAssetType {
  const clean = canonicalizeTicker(ticker);
  if (!clean) return 'ACAO';

  // BDR detection (usually 4 letters + 34/35)
  if (RE_BDR.test(clean)) return 'BDR';
  
  // FII and ETF detection (ends in 11)
  if (clean.endsWith('11')) {
    return ETFS_CONHECIDOS.has(clean) ? 'ETF' : 'FII';
  }
  
  // FII detection (ends in 12)
  if (clean.endsWith('12')) return 'FII';
  
  // Brazilian Stocks (4 letters + number 0, 1, 3, 4, 5, 6)
  if (/^[A-Z]{4}[0-9]$/.test(clean)) return 'ACAO';
  
  // US Stocks (1-5 letters, no numbers at the end usually)
  // If it's 3-5 letters and doesn't end in number, likely US Stock
  if (/^[A-Z]{1,5}$/.test(clean)) return 'STOCK';
  
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

function extractHostname(url?: string | null): string {
  if (!url) return '';
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
    'Referer'                  : `https://${hostname}/`,
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

      const chunkSize = rule.chunkSize ?? (rule.multiple ? 3000 : 400);
      const chunk = html.slice(idx, idx + chunkSize);

      if (rule.multiple) {
        const gRegex = getGlobalRegex(rule.extractRegex.source);
        const matches = [...chunk.matchAll(gRegex)];
        if (matches.length > 0) {
          results[rule.name] = matches
            .map(match => match[1]?.trim())
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
  valorMercado:  z.union([z.number(), z.string()]).optional(),
  marketCap:     z.union([z.number(), z.string()]).optional(),
  about:         z.string().optional(),
  sector:        z.string().optional(),
  segment:       z.string().optional(),
  subSector:     z.string().optional(),
  liquidezMediaDiaria: z.union([z.number(), z.string()]).optional(),
  segmentoListagem: z.string().optional(),
  tagAlong: z.string().optional(),
  freeFloat: z.string().optional(),
  payout: z.string().optional(),
  receitaLiquida: z.string().optional(),
  ebitda: z.string().optional(),
  lucroLiquido: z.string().optional(),
  dividendos: z.array(z.object({
    dataCom: z.string(),
    pagamento: z.string(),
    valor: z.string(),
    tipo: z.string()
  })).optional(),
});

export const FIISchema = z.object({
  precoAtual:        z.union([z.number(), z.string()]).optional(),
  dividendYield:     z.string().optional(),
  pvp:               z.union([z.number(), z.string()]).optional(),
  valorPatrimonial:  z.union([z.number(), z.string()]).optional(),
  liquidezDiaria:    z.union([z.number(), z.string()]).optional(),
  ultimoRendimento:  z.union([z.number(), z.string()]).optional(),
  vacanciaFisica:    z.string().optional(),
  vacanciaFinanceira: z.string().optional(),
  quantidadeAtivos:  z.union([z.number(), z.string()]).optional(),
  numeroCotistas:    z.union([z.number(), z.string()]).optional(),
  patrimonioLiquido: z.union([z.number(), z.string()]).optional(),
  variacaoDay:       z.string().optional(),
  valorMercado:      z.union([z.number(), z.string()]).optional(),
  marketCap:         z.union([z.number(), z.string()]).optional(),
  about:             z.string().optional(),
  sector:            z.string().optional(),
  segment:           z.string().optional(),
  subSector:         z.string().optional(),
  tipoGestao:        z.string().optional(),
  taxaAdmin:         z.string().optional(),
  dividendos: z.array(z.object({
    dataCom: z.string(),
    pagamento: z.string(),
    valor: z.string(),
    tipo: z.string()
  })).optional(),
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
    { name: 'precoAtual',    anchors: ['Preço Atual', 'Cotação', 'cotacao'],            extractRegex: /(?:_card-body|value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+)\s*(?:<[^>]*>)*\s*</i,  formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield', anchors: ['Dividend Yield', 'DY', 'Yield'],               extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</,      formatter: COMMON_FORMATTERS.pct },
    { name: 'pl',            anchors: ['P/L', 'P/Lucro', 'Preço/Lucro'],               extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pvp',           anchors: ['P/VP', 'P/Valor Patrimonial'],                  extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'vpa',           anchors: ['VPA', 'Valor Patrimonial por Ação'],            extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'lpa',           anchors: ['LPA', 'Lucro por Ação'],                        extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'roe',           anchors: ['ROE', 'Retorno sobre Patrimônio'],              extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'roic',          anchors: ['ROIC'],                                          extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'margemLiquida', anchors: ['Margem Líquida', 'Margem Liquida'],             extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'margemBruta',   anchors: ['Margem Bruta'],                                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'evEbitda',      anchors: ['EV/EBITDA'],                                    extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pEbit',         anchors: ['P/EBIT'],                                       extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'psr',           anchors: ['PSR'],                                          extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pAtivo',        anchors: ['P/Ativo'],                                      extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'pCapGiro',      anchors: ['P/Cap. Giro', 'P/Capital de Giro'],             extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'dividaLiquidaEbitda', anchors: ['Dív. Líq. / EBITDA', 'Divida Liquida / EBITDA'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'dividaLiquidaPatrimonio', anchors: ['Dív. Líq. / Patrimônio', 'Dív. Líq. / Patrimônio Líquido'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</, formatter: COMMON_FORMATTERS.num },
    { name: 'margemEbit',    anchors: ['Margem EBIT'],                                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'giroAtivos',    anchors: ['Giro Ativos'],                                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'liquidezCorrente', anchors: ['Liquidez Corrente'],                        extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.-]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'cagrReceita5Anos', anchors: ['CAGR Receita 5 Anos', 'CAGR Receita (5a)'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'cagrLucro5Anos', anchors: ['CAGR Lucro 5 Anos', 'CAGR Lucro (5a)'],     extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.+-]+\s*%?)\s*</,    formatter: COMMON_FORMATTERS.pct },
    { name: 'variacaoDay',   anchors: ['Var. Dia', 'var-day'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'liquidezMediaDiaria', anchors: ['Liquidez Média Diária', 'Liquidez Diária'], extractRegex: /(?:_card-body|value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*(?:<[^>]*>)*\s*</i, formatter: COMMON_FORMATTERS.num },
    { name: 'valorMercado', anchors: ['Valor de Mercado', 'VALOR DE MERCADO'], extractRegex: /(?:_card-body|value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*(?:<[^>]*>)*\s*</i, formatter: COMMON_FORMATTERS.num },

    { name: 'segmentoListagem', anchors: ['Segmento de Listagem'], extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'tagAlong', anchors: ['Tag Along'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'freeFloat', anchors: ['Free Float'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'payout', anchors: ['Payout'], extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'receitaLiquida', anchors: ['Receita Líquida', 'Receita Liquida'],          extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,  formatter: COMMON_FORMATTERS.num },
    { name: 'ebitda',        anchors: ['EBITDA'],                                       extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,  formatter: COMMON_FORMATTERS.num },
    { name: 'lucroLiquido',  anchors: ['Lucro Líquido', 'Lucro Liquido'],               extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,  formatter: COMMON_FORMATTERS.num },
    { name: 'sector',        anchors: ['Setor</span>', 'SETOR</span>'],                           extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'segment',       anchors: ['Segmento</span>', 'SEGMENTO</span>', 'Subsetor</span>', 'SUBSETOR</span>'],       extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'about',         anchors: ['Sobre a Empresa', 'Descrição'],                 extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
    { name: 'dividendosRaw', anchors: ['Histórico de Dividendos', 'Proventos', 'Pagamentos'], extractRegex: /<table[^>]*id="table-dividends"[^>]*>([\s\S]*?)<\/table>|<table[^>]*>(?:[\s\S]*?)(?:Data COM|Pagamento)(?:[\s\S]*?)<\/table>/i, chunkSize: 15000 },
  ],
};

export const fiiTemplate: ExtractorTemplate<FIIData> = {
  name: 'B3_FII',
  schema: FIISchema,
  rules: [
    { name: 'precoAtual',        anchors: ['Preço Atual', 'Cotação', 'cotacao'],              extractRegex: /(?:_card-body|value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+)\s*(?:<[^>]*>)*\s*</i,    formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield',     anchors: ['Dividend Yield', 'DY', 'Yield'],       extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'pvp',               anchors: ['P/VP'],                                 extractRegex: /(?:_card-body|value|content--info--item--value)[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'valorPatrimonial',  anchors: ['Valor Patrimonial', 'VP/Cota', 'VALOR PATRIMONIAL'],         extractRegex: /(?:_card-body|value|content--info--item--value)[\s\S]*?>\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*</i,    formatter: COMMON_FORMATTERS.num },
    { name: 'liquidezDiaria',    anchors: ['Liquidez', 'Liquidez Diária'],          extractRegex: /(?:_card-body|value)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*(?:<[^>]*>)*\s*</i, formatter: COMMON_FORMATTERS.num },
    { name: 'ultimoRendimento',  anchors: ['Último Rendimento', 'Rendimento', 'ÚLTIMO RENDIMENTO'],      extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'vacanciaFisica',    anchors: ['Vacância Física', 'Vacância', 'VACÂNCIA'],          extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'vacanciaFinanceira', anchors: ['Vacância Financeira'],                    extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'quantidadeAtivos',  anchors: ['Quantidade de Ativos', 'Qtd. Ativos'],      extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'numeroCotistas',    anchors: ['Nº de Cotistas', 'Número de Cotistas'],     extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+)\s*</,          formatter: COMMON_FORMATTERS.num },
    { name: 'patrimonioLiquido', anchors: ['Patrimônio Líquido', 'Patrimônio'],     extractRegex: /(?:_card-body|value|content--info--item--value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*(?:<[^>]*>)*\s*</i, formatter: COMMON_FORMATTERS.num },
    { name: 'variacaoDay',       anchors: ['Var. Dia', 'var-day'],                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'valorMercado',      anchors: ['Valor de Mercado', 'VALOR DE MERCADO'], extractRegex: /(?:_card-body|value|value d-block)[\s\S]*?>\s*(?:<[^>]*>)*\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*(?:<[^>]*>)*\s*</i, formatter: COMMON_FORMATTERS.num },

    { name: 'tipoGestao',        anchors: ['Tipo de Gestão'], extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'taxaAdmin',         anchors: ['Taxa de Administração', 'Taxa de Admin.'], extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'sector',            anchors: ['Segmento</span>', 'SEGMENTO</span>', 'Setor</span>', 'SETOR</span>'], extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'segment',           anchors: ['Subsetor</span>', 'SUBSETOR</span>', 'Tipo Anatel', 'TIPO ANATEL'], extractRegex: /class="value"[\s\S]*?>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*(?:<\/span>)?\s*</i },
    { name: 'about',             anchors: ['Sobre o Fundo', 'Descrição'],           extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
    { name: 'dividendosRaw',     anchors: ['Histórico de Rendimentos', 'Proventos', 'Pagamentos'], extractRegex: /<table[^>]*id="table-dividends"[^>]*>([\s\S]*?)<\/table>|<table[^>]*>(?:[\s\S]*?)(?:Data COM|Pagamento)(?:[\s\S]*?)<\/table>/i, chunkSize: 15000 },
  ],
};

export const bdrTemplate  = acaoTemplate;
export const etfTemplate: ExtractorTemplate<ETFData> = {
  name: 'B3_ETF',
  schema: ETFSchema,
  rules: [
    { name: 'precoAtual',        anchors: ['Preço Atual', 'Cotação'],              extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([R$]*\s*[\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'dividendYield',     anchors: ['Dividend Yield', 'DY', 'Yield'],       extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'pvp',               anchors: ['P/VP'],                                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+)\s*</,    formatter: COMMON_FORMATTERS.num },
    { name: 'patrimonioLiquido', anchors: ['Patrimônio Líquido', 'Patrimônio'],     extractRegex: /(?:_card-body|value|content--info--item--value)[\s\S]*?>\s*([R$]*\s*[\d,.]+\s*(?:K|M|B|T|Milhões|Bilhões|Bilhoes|Trilhões|Trilhoes)?)\s*</i, formatter: COMMON_FORMATTERS.num },
    { name: 'taxaAdmin',         anchors: ['Taxa de Administração', 'Taxa Admin'],  extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'variacaoDay',       anchors: ['Variação', 'variacao'],                 extractRegex: /(?:_card-body|value)[\s\S]*?>\s*([+-]?[\d,.]+\s*%?)\s*</, formatter: COMMON_FORMATTERS.pct },
    { name: 'about',             anchors: ['Sobre o ETF', 'Descrição'],             extractRegex: /<p[^>]*>([\s\S]*?)<\/p>/, formatter: (r: string) => r.replace(/<[^>]*>/g, '').trim() },
  ],
};

const ASSET_PRESETS: Record<string, {
  i10Base: string;
  template: ExtractorTemplate<any>;
}> = {
  ACAO: { i10Base: 'https://investidor10.com.br/acoes',  template: acaoTemplate },
  FII:  { i10Base: 'https://investidor10.com.br/fiis',   template: fiiTemplate  },
  BDR:  { i10Base: 'https://investidor10.com.br/bdrs',   template: bdrTemplate  },
  ETF:  { i10Base: 'https://investidor10.com.br/etfs',   template: etfTemplate  },
  STOCK: { i10Base: 'https://investidor10.com.br/stocks', template: acaoTemplate },
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
  currency?: string;
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
  ensureYahooConfig();
  
  const isBRLSymbol = ticker.endsWith('.SA') || /^[A-Z]{4}[0-9]{1,2}$/.test(ticker);
  const symbols = isBRLSymbol ? [`${ticker.replace(RE_SA, '')}.SA`] : [ticker.toUpperCase()];
  
  // For cryptos, maybe they need -USD suffix
  if (['BTC', 'ETH', 'SOL', 'LTC'].includes(ticker.toUpperCase())) {
    symbols.push(`${ticker.toUpperCase()}-USD`);
  }

  for (const symbol of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote) {
        continue;
      }
      
      const q = quote as any;
      if (!q.regularMarketPrice) continue;
      
      return {
        regularMarketPrice:          q.regularMarketPrice,
        regularMarketChangePercent:  q.regularMarketChangePercent,
        trailingPE:                  q.trailingPE,
        priceToBook:                 q.priceToBook,
        bookValue:                   q.bookValue,
        epsTrailingTwelveMonths:     q.epsTrailingTwelveMonths,
        trailingAnnualDividendYield: q.trailingAnnualDividendYield,
        marketCap:                   q.marketCap,
        longName:                    q.longName,
        shortName:                   q.shortName,
        currency:                    q.currency,
      };
    } catch (e) { 
      console.error(`[Nexus Debug] Error fetching quote for ${symbol}:`, e);
      // Silently fail for individual attempts
      continue; 
    }
  }
  return null;
}

async function yahooQuoteBulk(tickers: string[]): Promise<Map<string, YahooQuoteData>> {
  ensureYahooConfig();
  const results = new Map<string, YahooQuoteData>();
  if (tickers.length === 0) return results;

  const symbols = tickers.map(t => {
    const isBRLSymbol = t.endsWith('.SA') || /^[A-Z]{4}[0-9]{1,2}$/.test(t);
    return isBRLSymbol ? `${t.replace(RE_SA, '')}.SA` : t.toUpperCase();
  });

  try {
    const quotes = await yahooFinance.quote(symbols, { return: 'array' } as any);
    const quoteList = Array.isArray(quotes) ? quotes : [quotes];
    
    quoteList.forEach((q: any) => {
      if (!q || !q.symbol) return;
      
      const data: YahooQuoteData = {
        regularMarketPrice:          q.regularMarketPrice,
        regularMarketChangePercent:  q.regularMarketChangePercent,
        trailingPE:                  q.trailingPE,
        priceToBook:                 q.priceToBook,
        bookValue:                   q.bookValue,
        epsTrailingTwelveMonths:     q.epsTrailingTwelveMonths,
        trailingAnnualDividendYield: q.trailingAnnualDividendYield,
        marketCap:                   q.marketCap,
        longName:                    q.longName,
        shortName:                   q.shortName,
        currency:                    q.currency,
      };
      
      const baseTicker = q.symbol.replace(RE_SA, '');
      results.set(baseTicker, data);
      if (q.symbol.includes('-')) results.set(q.symbol.split('-')[0], data);
    });
  } catch (e) {
    console.error('[Nexus Bulk] Error in bulk quote:', e);
  }
  
  return results;
}

async function yahooFundamentals(ticker: string, _timeoutMs: number): Promise<YahooFundamentalsData> {
  ensureYahooConfig();
  const symbols  = [`${ticker}.SA`, ticker.toUpperCase()];
  
  for (const symbol of symbols) {
    try {
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['financialData', 'defaultKeyStatistics', 'assetProfile']
      } as any);
      
      if (!result) continue;

      // Check for errors in the response object
      if ((result as any).errors || (result as any).error) {
        console.warn(`[YAHOO] Fundamentals for ${symbol} returned errors:`, formatYahooError((result as any).errors || (result as any).error));
        continue;
      }
      
      const res = result as any;
      const fd = res?.financialData;
      const ks = res?.defaultKeyStatistics;
      const ap = res?.assetProfile;
      
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
      console.warn(`[YAHOO] Erro ao buscar fundamentos para ${symbol}:`, formatYahooError(e));
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
    concurrencyLimit: 15,
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
          throw new Error(`HTTP ${res.status}`);
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

  static async fetchHistoricalFundamentals(ticker: string) {
    const cleanTicker = canonicalizeTicker(ticker);
    const isBrazilian = /^[A-Z]{4}[3-6]$/.test(cleanTicker) || cleanTicker.endsWith('11') || cleanTicker.endsWith('12');
    const symbols = [isBrazilian ? `${cleanTicker}.SA` : cleanTicker, cleanTicker];

    for (const symbol of symbols) {
      try {
        const result = await yahooFinance.quoteSummary(symbol, {
          modules: ['incomeStatementHistory', 'balanceSheetHistory', 'earningsHistory', 'defaultKeyStatistics']
        } as any);

        if (!result) continue;

        if ((result as any).errors || (result as any).error) continue;

        const res = result as any;
        const incomeHistory = res?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceHistory = res?.balanceSheetHistory?.balanceSheetStatements || [];

        // Combine by year
        const historyData: any[] = [];
        
        incomeHistory.forEach((inc: any) => {
          const dt = inc.endDate;
          if (dt) {
            const year = dt.getFullYear();
            historyData.push({
              year,
              revenue: inc.totalRevenue,
              netIncome: inc.netIncome || inc.netIncomeApplicableToCommonShares,
              ebitda: inc.ebitda || inc.ebit
            });
          }
        });

        // Merge balance sheet data
        balanceHistory.forEach((bal: any) => {
          const dt = bal.endDate;
          if (dt) {
            const year = dt.getFullYear();
            let existing = historyData.find(h => h.year === year);
            if (!existing) {
              existing = { year };
              historyData.push(existing);
            }
            existing.patrimony = bal.totalStockholderEquity;
            existing.totalAssets = bal.totalAssets;
            existing.totalLiabilities = bal.totalLiab;
          }
        });

        if (historyData.length > 0) {
          return historyData.sort((a, b) => a.year - b.year);
        }

      } catch (e) {
        continue;
      }
    }
    return [];
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
      const isGlobal = clean === 'IBOVESPA' || clean === 'MARKET';
      const query = isGlobal ? 'IBOVESPA' : clean;

      // Use yahoo finance search which is more reliable
      const searchResult = await yahooFinance.search(query, {
        newsCount: isGlobal ? 30 : 10,
        quotesCount: 0
      } as any);

      const items: NewsItem[] = [];
      
      if (searchResult && searchResult.news) {
        for (const article of searchResult.news) {
          const pubDate = article.providerPublishTime ? new Date(article.providerPublishTime * 1000) : new Date();
          
          // Only keep news from last 15 days
          const diffDays = (new Date().getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
          
          if (diffDays <= 15) {
            items.push({
              title: article.title,
              link: article.link,
              pubDate: pubDate,
              source: article.publisher || 'Yahoo Finance',
              thumbnail: article.thumbnail
            });
          }
        }
      }
      
      // Sort newest to oldest
      items.sort((a, b) => (b.pubDate as Date).getTime() - (a.pubDate as Date).getTime());
      
      const finalItems = items.slice(0, isGlobal ? 30 : 8);
      return finalItems;
    } catch (e) {
      console.error(`[Nexus] Error fetching news for ${ticker}:`, e);
      return [];
    }
  }

  /**
   * Busca rankings de ativos baseados em critérios específicos.
   * Simula a extração de dados de rankings do Investidor10.
   */
  static async fetchRanking(category: string, type: ExtendedAssetType = 'ACAO'): Promise<any[]> {
    const cacheKey = `ranking:${category}:${type}`;
    const cached = this._cache.get(cacheKey);
    if (cached && !this.isStale(cached)) return cached.data;

    try {
      // Como não temos uma API direta de ranking, vamos buscar os top ativos do Yahoo Finance
      // ou simular baseado em uma lista pré-definida de ativos populares se a busca falhar.
      const popularTickers: any = {
        ACAO: [
          'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4', 'ABEV3', 'WEGE3', 'RENT3', 'ELET3', 'MGLU3', 
          'PRIO3', 'EGIE3', 'VBBR3', 'RAIL3', 'CSNA3', 'B3SA3', 'SUZB3', 'GGBR4', 'RDOR3', 'RADL3',
          'VIVA3', 'LREN3', 'ASAI3', 'HAPV3', 'CCRO3', 'CMIG4', 'SBSP3', 'CPLE6', 'ENEV3', 'TIMS3',
          'VIVT3', 'KLBN11', 'EQTL3', 'TAEE11', 'ALPA4', 'CVCB3', 'GOLL4', 'AZUL4', 'BRFS3', 'JBSS3',
          'MRFG3', 'BEEF3', 'SMTO3', 'TOTS3', 'BPAC11', 'SANB11', 'BBSE3', 'CXSE3', 'PSSA3', 'IRBR3',
          'MULT3', 'IGTI11', 'CYRE3', 'MRVE3', 'EZTC3', 'DIRR3', 'TEND3', 'JHSF3', 'CSAN3', 'SLCE3'
        ],
        FII: [
          'HGLG11', 'KNRI11', 'XPLG11', 'MXRF11', 'VISC11', 'BTLG11', 'XPML11', 'IRDM11', 'CPTS11', 
          'KNIP11', 'HGRU11', 'VILG11', 'BRCR11', 'VRTA11', 'VGIP11', 'RECR11', 'VGHF11', 'TGAR11',
          'MCCI11', 'RBRR11', 'RBRF11', 'BCFF11', 'ALZR11', 'TRXF11', 'RBRP11', 'HGBS11', 'HSML11',
          'MALL11', 'VINO11', 'GGRC11', 'SDIL11', 'LVBI11', 'KNSC11', 'RZAK11', 'BTRA11', 'SNAG11',
          'RZTR11', 'XPIN11', 'SNCI11', 'VTAA11', 'CACR11', 'ARCT11', 'GZIT11', 'VIFI11', 'OURE11'
        ],
        BDR: [
          'AAPL34', 'GOGL34', 'AMZO34', 'MSFT34', 'TSLA34', 'NVDC34', 'META34'
        ],
        ETF: [
          'BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XINA11'
        ],
        STOCK: [
          'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NVDA', 'V', 'JPM'
        ],
        CRYPTO: [
          'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD'
        ]
      };

      const tickers = popularTickers[type] || popularTickers.ACAO;
      
      // Step 1: Bulk Fetch from Yahoo (Fast)
      const bulkQuotes = await yahooQuoteBulk(tickers);

      // Step 2: Complement with individual fetches only if missing
      const results = await this.executeBatch(
        tickers.map((ticker: string) => async () => {
          try {
            const q = bulkQuotes.get(ticker);
            
            // If we have Yahoo data, use it to avoid slow scraper hits in ranking
            if (q) {
              const rawData = {
                precoAtual: q.regularMarketPrice,
                variacaoDay: q.regularMarketChangePercent != null ? `${q.regularMarketChangePercent > 0 ? '+' : ''}${q.regularMarketChangePercent.toFixed(2)}%` : '0,00%',
                dividendYield: q.trailingAnnualDividendYield != null ? `${(q.trailingAnnualDividendYield * 100).toFixed(2)}%` : '0,00%',
                pl: q.trailingPE != null ? q.trailingPE.toFixed(2) : '0,00',
                pvp: q.priceToBook != null ? q.priceToBook.toFixed(2) : '0,00',
                marketCap: q.marketCap,
                name: q.longName || q.shortName || ticker,
                currency: q.currency || 'BRL'
              };

              return {
                ticker: ticker,
                name: rawData.name,
                value: 'N/A',
                subValue: `R$ ${rawData.precoAtual || '0,00'}`,
                raw: rawData
              };
            }

            // Do NOT fallback to scraper for ranks as it causes timeouts on 404s
            return null;
          } catch (err) {
            console.warn(`[Nexus] Failed to fetch ticker ${ticker} for ranking:`, err);
            return null;
          }
        })
      );

      const filteredResults = results.filter((r): r is any => r !== null && (r as any).raw && Object.keys((r as any).raw).length > 0);

      // Ordenação baseada na categoria
      let sorted = [...filteredResults];
      const cat = category.toLowerCase();

      if (cat.includes('dividend') || cat.includes('yield') || cat.includes('bazin')) {
        sorted.sort((a, b) => {
          const valA = a.raw ? safeParse(a.raw.dividendYield) : 0;
          const valB = b.raw ? safeParse(b.raw.dividendYield) : 0;
          return valB - valA;
        });
        sorted.forEach(s => s.value = (s.raw && s.raw.dividendYield) || '0,00%');
      } else if (cat.includes('pl') || cat.includes('baratas') || cat.includes('graham')) {
        if (cat.includes('graham')) {
          // Graham Formula: sqrt(22.5 * VPA * LPA)
          sorted.forEach(s => {
            const vpa = safeParse(s.raw?.vpa);
            const lpa = safeParse(s.raw?.lpa);
            if (vpa > 0 && lpa > 0) {
              const grahamValue = Math.sqrt(22.5 * vpa * lpa);
              const preco = safeParse(s.raw?.precoAtual);
              const discount = preco > 0 ? ((grahamValue - preco) / grahamValue) * 100 : 0;
              s.value = `R$ ${grahamValue.toFixed(2)}`;
              s.subValue = `${discount.toFixed(1)}% de desconto`;
              s.sortVal = discount;
            } else {
              s.sortVal = -999;
            }
          });
          sorted.sort((a, b) => b.sortVal - a.sortVal);
        } else {
          sorted.sort((a, b) => {
            const v1 = safeParse(a.raw?.pl) || 999;
            const v2 = safeParse(b.raw?.pl) || 999;
            return (v1 > 0 && v2 > 0) ? v1 - v2 : v2 - v1;
          });
          sorted.forEach(s => s.value = s.raw?.pl || 'N/A');
        }
      } else if (cat.includes('altas') || cat.includes('flame')) {
        sorted.sort((a, b) => safeParse(b.raw?.variacaoDay) - safeParse(a.raw?.variacaoDay));
        sorted.forEach(s => s.value = s.raw?.variacaoDay || '0,00%');
      } else if (cat.includes('roe') || cat.includes('trophy')) {
        sorted.sort((a, b) => safeParse(b.raw?.roe) - safeParse(a.raw?.roe));
        sorted.forEach(s => s.value = s.raw?.roe || '0,00%');
      } else if (cat.includes('margem') || cat.includes('pie')) {
        sorted.sort((a, b) => safeParse(b.raw?.margemLiquida) - safeParse(a.raw?.margemLiquida));
        sorted.forEach(s => s.value = s.raw?.margemLiquida || '0,00%');
      } else if (cat.includes('pvp')) {
        sorted.sort((a, b) => {
          const v1 = safeParse(a.raw?.pvp) || 999;
          const v2 = safeParse(b.raw?.pvp) || 999;
          return (v1 > 0 && v2 > 0) ? v1 - v2 : v2 - v1;
        });
        sorted.forEach(s => s.value = s.raw?.pvp || 'N/A');
      } else if (cat.includes('capitalização') || cat.includes('maiores') || cat.includes('market cap') || cat.includes('valuation')) {
        sorted.sort((a, b) => (b.raw?.marketCap || 0) - (a.raw?.marketCap || 0));
        sorted.forEach(s => s.value = s.raw?.marketCap ? `R$ ${(s.raw.marketCap / 1e9).toFixed(2)}B` : 'N/A');
      } else if (cat.includes('prejuízo') || cat.includes('buy and hold')) {
        // Filter by positive margins and ROE
        sorted = sorted.filter(s => safeParse(s.raw?.margemLiquida) > 0 && safeParse(s.raw?.roe) > 0);
        sorted.sort((a, b) => safeParse(b.raw?.roe) - safeParse(a.raw?.roe));
        sorted.forEach(s => s.value = s.raw?.roe || '0,00%');
      } else {
        // Default sorting by DY if unknown
        sorted.sort((a, b) => safeParse(b.raw?.dividendYield) - safeParse(a.raw?.dividendYield));
        sorted.forEach(s => s.value = s.raw?.dividendYield || '0,00%');
      }

      const finalData = sorted.slice(0, 50);
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
          STOCK: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA']
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
      STOCK: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS']
    };

    const tickers = popularTickers[type] || popularTickers.ACAO;
    
    const results = await this.executeBatch(
      tickers.map((ticker: string) => async () => {
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
        const val = r.results.dividendYield;
        const dy = parseFloat(typeof val === 'string' ? val.replace('%', '').replace(',', '.') : String(val || '0'));
        return dy >= parseFloat(filters.minDY);
      });
    }
    if (filters.maxPL) {
      filtered = filtered.filter(r => {
        const val = r.results.pl;
        const pl = parseFloat(typeof val === 'string' ? val.replace(',', '.') : String(val || '999'));
        return pl > 0 && pl <= parseFloat(filters.maxPL);
      });
    }
    if (filters.maxPVP) {
      filtered = filtered.filter(r => {
        const val = r.results.pvp;
        const pvp = parseFloat(typeof val === 'string' ? val.replace(',', '.') : String(val || '999'));
        return pvp > 0 && pvp <= parseFloat(filters.maxPVP);
      });
    }
    if (filters.minROE) {
      filtered = filtered.filter(r => {
        const val = r.results.roe;
        const roe = parseFloat(typeof val === 'string' ? val.replace('%', '').replace(',', '.') : String(val || '0'));
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

  static async searchSuggestions(query: string) {
    try {
      const q = query.toUpperCase();
      const result = await yahooFinance.search(q);
      
      if (result && (result as any).errors) {
        console.warn(`[YAHOO] searchSuggestions for ${q} returned errors:`, formatYahooError((result as any).errors));
      }
      
      // Prioritize Brazilian assets if query looks like a ticker
      let quotes = (result as any).quotes || [];
      if (/^[A-Z]{4}[0-9]{1,2}$/.test(q)) {
        quotes = quotes.sort((a: any, b: any) => {
          const aIsBr = a.symbol.endsWith('.SA');
          const bIsBr = b.symbol.endsWith('.SA');
          if (aIsBr && !bIsBr) return -1;
          if (!aIsBr && bIsBr) return 1;
          return 0;
        });
      }

      return quotes.slice(0, 6).map((q: any) => ({
        ticker: q.symbol.replace('.SA', ''),
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType || 'EQUITY'
      }));
    } catch (error) {
      console.error('Error in searchSuggestions:', error);
      return [];
    }
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
    type: ExtendedAssetType;
  }> {
    try {
      const cleanTicker = canonicalizeTicker(ticker);
      const erroVal     = validarTicker(cleanTicker);
      if (erroVal) {
        return { ticker: cleanTicker, results: {}, cacheStatus: 'ERROR', metrics: { error: erroVal }, type };
      }
      const preset  = ASSET_PRESETS[type] || ASSET_PRESETS.ACAO;
      const t       = cleanTicker.toLowerCase();
      const sources: ScrapeSource<any>[] = preset ? [
        { url: `${preset.i10Base}/${t}/`, template: preset.template, requireStealth: true },
      ] : [];

      const startTime = performance.now();
      const startCpu  = safeCpuStart();

      const [scrapeResult, yahooResult, yahooFund, newsResult] = await Promise.allSettled([
        this.execute(sources),
        yahooQuote(cleanTicker, this._options.fetchTimeoutMs),
        yahooFundamentals(cleanTicker, this._options.fetchTimeoutMs),
        includeNews ? this.fetchNews(cleanTicker) : Promise.resolve(undefined),
      ]);

      const scrape   = scrapeResult.status === 'fulfilled' ? scrapeResult.value : { 
        data: {}, 
        bytes: 0, 
        earlyAbort: false, 
        cacheStatus: 'ERROR',
        error: scrapeResult.status === 'rejected' ? scrapeResult.reason : 'Unknown scraper error'
      };
      
      if (scrapeResult.status === 'rejected') {
        console.warn(`[Nexus] Scraper failed for ${ticker}:`, scrapeResult.reason);
      }
      const quote    = yahooResult.status  === 'fulfilled' ? yahooResult.value  : null;
      const fund     = yahooFund.status    === 'fulfilled' ? yahooFund.value    : {};
      const newsData = newsResult.status   === 'fulfilled' ? newsResult.value   : undefined;
      // 1. Prefer Scraper as the Primary Source for B3 market data (usually more specific/reliable)
      // but keep Yahoo as a fallback for missing fields or real-time price updates if Scraper hasn't updated recently.
      const combined = { ...scrape.data } as Record<string, any>;
      
      if (quote) {
        const q = quote as any;
        // Priority: Real-time price from Yahoo over scraper
        if (q.regularMarketPrice != null) {
          combined['precoAtual'] = q.regularMarketPrice;
        }
        if (combined['currency'] === undefined) combined['currency'] = q.currency;
        if (q.regularMarketChangePercent != null) {
          combined['variacaoDay'] = (q.regularMarketChangePercent > 0 ? '+' : '') + q.regularMarketChangePercent.toFixed(2) + '%';
        }
        if (combined['name'] === undefined) combined['name'] = q.longName || q.shortName;
      }

      // Prefer scraped market properties over Yahoo as they are usually more specific to the B3 market
      if (combined['valorMercado']) combined['marketCap'] = combined['valorMercado'];
      if (combined['patrimonioLiquido']) combined['equity'] = combined['patrimonioLiquido'];

      const fill = (k: string, v: unknown) => {
        if (combined[k] !== undefined || v == null) return;
        
        const s = typeof v === 'number' ? v.toFixed(2) : String(v).trim();
        if (!VALORES_INVALIDOS.has(s)) combined[k] = s;
      };

      if (fund) {
        fill('margemLiquida',  fund.profitMargins    != null ? (fund.profitMargins    * 100).toFixed(2) + '%' : undefined);
        fill('margemBruta',    fund.grossMargins     != null ? (fund.grossMargins     * 100).toFixed(2) + '%' : undefined);
        fill('roe',            fund.returnOnEquity   != null ? (fund.returnOnEquity   * 100).toFixed(2) + '%' : undefined);
        fill('roa',            fund.returnOnAssets   != null ? (fund.returnOnAssets   * 100).toFixed(2) + '%' : undefined);
        fill('dividaLiquidaEbitda', fund.debtToEquity != null ? fund.debtToEquity.toFixed(2) : undefined);
        fill('about',          fund.about);
        fill('sector',         fund.sector);
        fill('segment',        fund.subSector);
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
        type,
        metrics: {
          totalTimeMs,
          bytesProcessed:    scrape.bytes,
          foundKeys:         Object.keys(combined),
          successRate:       preset ? Object.keys(combined).length / preset.template.rules.length : 0,
          earlyAbort:        scrape.earlyAbort,
          source:            sources_used.join(' + ') || 'None',
          cpuUsageMs:        safeCpuDeltaMs(startCpu),
          estimatedMemoryMb: Number((scrape.bytes / 1024 / 1024).toFixed(2)),
        },
      };
    } catch (e) {
      console.error(`[Nexus] Fatal error fetching ${ticker}:`, e);
      return {
        ticker,
        results: {},
        cacheStatus: 'ERROR',
        type,
        metrics: { error: (e as Error).message }
      };
    }
  }

  static async fetchB3(ticker: string): Promise<{ data: Partial<B3Data>; bytes: number; earlyAbort: boolean; cacheStatus: string }> {
    const r = await this.fetchAtivo(ticker, 'ACAO');
    return { data: r.results, bytes: r.metrics.bytesProcessed, earlyAbort: r.metrics.earlyAbort, cacheStatus: r.cacheStatus };
  }

  static async fetchHistoricoGrafico(ticker: string, range: string = '1y', interval: string = '1d'): Promise<any[]> {
    const cleanTicker = canonicalizeTicker(ticker);
    const symbols = [`${cleanTicker}.SA`, cleanTicker];
    
    // Calculate period1 based on range
    const now = new Date();
    let period1: Date;
    switch (range) {
      case '1d': period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '5d': period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); break;
      case '1mo': 
      case '1m': period1 = new Date(new Date().setMonth(now.getMonth() - 1)); break;
      case '6mo':
      case '6m': period1 = new Date(new Date().setMonth(now.getMonth() - 6)); break;
      case '1y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 1)); break;
      case '5y': period1 = new Date(new Date().setFullYear(now.getFullYear() - 5)); break;
      case 'max': period1 = new Date(0); break;
      default: period1 = new Date(new Date().setFullYear(now.getFullYear() - 1));
    }
      
    for (const symbol of symbols) {
      try {
        const result = await yahooFinance.chart(symbol, {
          period1: period1,
          interval: interval as any,
          validate: false
        } as any);
        
        if (!result) continue;

        if ((result as any).errors || (result as any).error) {
          console.warn(`[YAHOO] Chart for ${symbol} returned errors:`, formatYahooError((result as any).errors || (result as any).error));
          continue;
        }

        if (!(result as any).quotes || (result as any).quotes.length === 0) continue;
        
        return (result as any).quotes.map((q: any) => ({
          date: q.date.toISOString(),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume,
        })).filter((d: any) => d.close !== null && d.close !== undefined);
      } catch (e) {
        console.warn(`[YAHOO] Erro ao buscar histórico para ${symbol}:`, formatYahooError(e));
        continue;
      }
    }
    return [];
  }

  static async fetchDividends(ticker: string): Promise<any[]> {
    const cleanTicker = canonicalizeTicker(ticker);
    const assetType = inferAssetType(cleanTicker);
    
    // Primary source: Scraping (resilient)
    try {
      const scrapeResult = await this.fetchAtivo(cleanTicker, assetType);
      let htmlTable = scrapeResult.results?.dividendosRaw;
      
      // Secondary attempt if primary scraper failed to find the specific table ID
      if (!htmlTable && scrapeResult.results?.html) {
        const tableMatch = scrapeResult.results.html.match(/<table[^>]*>(?:[\s\S]*?)(?:Data COM|Pagamento)(?:[\s\S]*?)<\/table>/i);
        if (tableMatch) htmlTable = tableMatch[0];
      }
      
      if (htmlTable) {
        const dividends: any[] = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
        
        let rowMatch;
        let colIndices = { tipo: 0, dataCom: 1, pagamento: 2, valor: 3 };
        
        // Find headers first to map column indices dynamically
        const headerMatch = /<thead[^>]*>([\s\S]*?)<\/thead>|<tr[^>]*>([\s\S]*?)<\/tr>/.exec(htmlTable);
        if (headerMatch) {
          const headersHtml = headerMatch[0];
          const headers: string[] = [];
          let hMatch;
          while ((hMatch = headerRegex.exec(headersHtml)) !== null) {
            headers.push(hMatch[1].replace(/<[^>]*>/g, '').trim().toLowerCase());
          }
          if (headers.length > 0) {
            const iTipo = headers.findIndex(h => h.includes('tipo'));
            const iCom = headers.findIndex(h => h.includes('com') || h.includes('base') || h.includes('aprovação'));
            const iPag = headers.findIndex(h => h.includes('pagamento'));
            const iValor = headers.findIndex(h => h === 'valor' || h === 'rendimento' || h.includes('valor'));
            
            if (iTipo !== -1) colIndices.tipo = iTipo;
            if (iCom !== -1) colIndices.dataCom = iCom;
            if (iPag !== -1) colIndices.pagamento = iPag;
            if (iValor !== -1) colIndices.valor = iValor;
          }
        }

        const rows = [...htmlTable.matchAll(rowRegex)];
        for (const rowMatch of rows) {
          const cells: string[] = [];
          let cellMatch;
          const rowHtml = rowMatch[1];
          while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
            cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
          }
          
          if (cells.length >= 4) {
            const tipo = cells[colIndices.tipo] || '';
            const dataComRaw = cells[colIndices.dataCom] || '';
            const pagamentoRaw = cells[colIndices.pagamento] || '';
            const valorRaw = cells[colIndices.valor] || '';
            
            if (dataComRaw.includes('/')) {
              const [d, m, y] = dataComRaw.split('/');
              if (d && m && y && y.length === 4) {
                const date = new Date(`${y}-${m}-${d}T12:00:00Z`);
                
                let paymentDate = date.toISOString();
                if (pagamentoRaw && pagamentoRaw.includes('/')) {
                  const [pd, pm, py] = pagamentoRaw.split('/');
                  if (pd && pm && py && py.length === 4) paymentDate = new Date(`${py}-${pm}-${pd}T12:00:00Z`).toISOString();
                }
                
                const amountClean = valorRaw.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
                const amount = parseFloat(amountClean);
                
                if (!isNaN(amount) && amount > 0) {
                  dividends.push({
                    date: date.toISOString(),
                    paymentDate,
                    dataCom: date.toISOString(),
                    amount: amount,
                    type: tipo || (cleanTicker.endsWith('11') ? 'Rendimento' : 'Dividendo')
                  });
                }
              }
            }
          }
        }
        
        if (dividends.length > 0) {
          return dividends.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      }
    } catch (err) {
      console.warn(`[Nexus] Dividend scraping failed for ${ticker}`, err);
    }

    // Secondary source: Yahoo Finance (Historical Dividends)
    try {
      ensureYahooConfig();
      const symbol = cleanTicker.endsWith('.SA') ? cleanTicker : (assetType === 'ACAO' || assetType === 'FII' ? `${cleanTicker}.SA` : cleanTicker);
      const today = new Date();
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(today.getFullYear() - 5);
      
      const futureDate = new Date();
      futureDate.setFullYear(today.getFullYear() + 1); // Fetch 1 year into the future

      const historical = await yahooFinance.historical(symbol, {
        period1: fiveYearsAgo,
        period2: futureDate,
        events: 'dividends'
      } as any);

      if (Array.isArray(historical) && historical.length > 0) {
        return historical.map((h: any) => ({
          date: h.date?.toISOString(),
          paymentDate: h.date?.toISOString(),
          dataCom: h.date?.toISOString(),
          amount: h.dividends || 0,
          type: cleanTicker.endsWith('11') ? 'Rendimento' : 'Dividendo'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (err) {
      console.warn(`[Nexus] Yahoo dividends failed for ${ticker}`, err);
    }

    return [];
  }

  static async searchTicker(query: string): Promise<any[]> {
    try {
      const genericQuery = query.toLowerCase().trim();
      const genericMap: Record<string, string[]> = {
        'ações': ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA', 'WEGE3.SA', 'ELET3.SA', 'ABEV3.SA', 'RENT3.SA', 'B3SA3.SA'],
        'fiis': ['MXRF11.SA', 'HGLG11.SA', 'BTLG11.SA', 'CPTS11.SA', 'KNRI11.SA', 'VISC11.SA', 'XPLG11.SA', 'IRDM11.SA', 'BCFF11.SA', 'VRTA11.SA'],
        'bdr': ['AAPL34.SA', 'MSFT34.SA', 'GOGL34.SA', 'AMZO34.SA', 'MELI34.SA', 'NVDC34.SA', 'META34.SA', 'NFLX34.SA'],
        'bdrs': ['AAPL34.SA', 'MSFT34.SA', 'GOGL34.SA', 'AMZO34.SA', 'MELI34.SA', 'NVDC34.SA', 'META34.SA', 'NFLX34.SA'],
        'stocks': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'UNH', 'JNJ'],
        'cripto': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'DOT-USD']
      };

      if (genericMap[genericQuery]) {
        const topSymbols = genericMap[genericQuery];
        const results = await Promise.all(topSymbols.map(async (symbol) => {
          try {
            const qResp = await yahooFinance.quote(symbol) as any;
            return {
              symbol: qResp.symbol,
              shortname: qResp.shortName || qResp.longName || symbol,
              longname: qResp.longName || qResp.shortName || symbol,
              typeDisp: genericQuery === 'cripto' ? 'Cryptocurrency' : 'Equity',
              regularMarketPrice: qResp.regularMarketPrice,
              regularMarketChangePercent: qResp.regularMarketChangePercent
            };
          } catch (e) {
            return null;
          }
        }));
        return results.filter(Boolean);
      }

      const isBrazilian = query.length >= 4 && query.length <= 6 && !query.includes('.');
      const searchQuery = isBrazilian ? `${query}.SA` : query;
      
      const result = await yahooFinance.search(searchQuery, {
        quotesCount: 12,
        newsCount: 0
      });
      
      if (result && (result as any).errors) {
        console.warn(`[YAHOO] Search for ${searchQuery} returned errors:`, formatYahooError((result as any).errors));
      }

      let quotes = (result as any)?.quotes ?? [];
      
      // If no results and we tried with .SA, try without .SA
      if (quotes.length === 0 && isBrazilian) {
        const fallbackResult = await yahooFinance.search(query, {
          quotesCount: 12,
          newsCount: 0
        }) as any;
        
        if (fallbackResult && (fallbackResult as any).errors) {
          console.warn(`[YAHOO] Fallback search for ${query} returned errors:`, formatYahooError((fallbackResult as any).errors));
        }
        
        quotes = (fallbackResult as any)?.quotes ?? [];
      }

      const enrichedQuotes = await Promise.all(quotes.map(async (q: any) => {
        try {
          const quoteData = await yahooQuote(q.symbol, 2000);
          return {
            ...q,
            ticker: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            exchange: q.exchange,
            type: q.quoteType,
            price: quoteData?.regularMarketPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            change: quoteData?.regularMarketChangePercent ? `${quoteData.regularMarketChangePercent > 0 ? '+' : ''}${quoteData.regularMarketChangePercent.toFixed(2)}%` : undefined,
            positive: quoteData?.regularMarketChangePercent ? quoteData.regularMarketChangePercent >= 0 : undefined
          };
        } catch (e) {
          return {
            ...q,
            ticker: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            exchange: q.exchange,
            type: q.quoteType
          };
        }
      }));
      
      return enrichedQuotes;
    } catch (e) {
      console.warn(`[YAHOO] Erro ao buscar ticker para ${query}:`, formatYahooError(e));
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
        .then(res  => { 
          results[idx] = res; 
          (this as any)._totalSuccess++;
        })
        .catch(err => { 
          results[idx] = err instanceof Error ? err : new Error(String(err)); 
          (this as any)._totalFailures++;
          console.error(`[Nexus] Task failed in batch #${idx}:`, err);
        })
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
      const key    = `nexus:${preset.i10Base}/${clean}/`;
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
    tickers.map((ticker: string) => async () => {
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
    tickers.map((ticker: string) => async () => {
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
